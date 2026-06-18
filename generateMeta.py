import json
import random
from datetime import datetime
from faker import Faker
import geopandas as gpd
from shapely.geometry import box

fake = Faker()

# Load SA provinces shapefile
shapefile_path = "../../Data/Data/Administrative_Boundaries/Province.shp"
sa_provinces = gpd.read_file(shapefile_path)

province_geometries = {row['Province']: row['geometry'] for _, row in sa_provinces.iterrows()}

categories = {
    "Water Resources": "Assessing water quality, water levels, and the extent of water bodies, including wetlands and coastal areas. This dataset provides critical information for water management authorities and environmental researchers.",
    "Climate Change": "Monitoring temperature variations, precipitation patterns, and extreme weather events to study climate change impacts across different regions.",
    "Transportation": "Analyzing road networks, traffic patterns, and transportation infrastructure to support urban planning and logistics.",
    "Disaster Management": "Monitoring flood extent, wildfire damage, and other disaster impacts to enable effective emergency response and recovery planning.",
    "Ecosystems": "Analyzing biodiversity, habitat conditions, and ecosystem health to support conservation efforts and environmental protection.",
    "Geology": "Mapping geological formations, identifying mineral deposits, and studying terrain characteristics for resource exploration and hazard assessment.",
    "Mineral Exploration": "Identifying potential mining sites, mineral resources, and extraction opportunities while considering environmental impacts.",
    "Rangelands": "Monitoring vegetation cover, grazing conditions, and land degradation in pastoral areas to support sustainable livestock management.",
    "Agriculture": "Monitoring crop health, irrigation patterns, and yield predictions to support food security and agricultural development.",
    "Energy": "Analyzing energy infrastructure, renewable energy potential, and consumption patterns to support energy planning and policy.",
    "Biodiversity": "Tracking species distribution, endangered populations, and conservation areas to protect South Africa's rich biological heritage.",
    "Urban Planning": "Analyzing urban sprawl, transportation networks, and infrastructure to guide sustainable city development and land use policies.",
    "Mining": "Monitoring mining activities, environmental impacts, and resource extraction to balance economic benefits with ecological preservation.",
    "Forestry": "Assessing forest cover, timber volume, and forest health to support sustainable forest management and conservation.",
    "Rural Development": "Analyzing rural infrastructure, service delivery, and economic opportunities to support equitable development across provinces.",
    "Human Settlements": "Monitoring housing developments, informal settlements, and service delivery to support urban planning and policy making.",
    "Weather Services": "Collecting and analyzing meteorological data to improve weather forecasting and climate monitoring services.",
    "Air Quality": "Monitoring pollution levels, particulate matter, and greenhouse gas emissions to assess environmental health impacts.",
    "Land Cover": "Classifying and monitoring land cover types to understand landscape changes and support environmental management.",
    "Land Use": "Analyzing how land is utilized for agriculture, urban areas, conservation, and other purposes to inform planning decisions."
}

organizations = {
    "Water Resources": ("Dept. of Water & Sanitation", "water@dws.gov.za", "+27 12 336 7500", "www.dws.gov.za"),
    "Climate Change": ("DFFE", "climate@dffe.gov.za", "+27 12 399 9000", "www.dffe.gov.za"),
    "Agriculture": ("DALRRD", "info@dalrrd.gov.za", "+27 12 319 6000", "www.dalrrd.gov.za"),
    "Disaster Management": ("NDMC", "ndmc@ndmc.gov.za", "+27 12 848 4600", "www.ndmc.gov.za"),
    "Urban Planning": ("COGTA", "info@cogta.gov.za", "+27 12 334 0500", "www.cogta.gov.za"),
    "Mining": ("DMRE", "info@dmre.gov.za", "+27 12 444 3000", "www.dmre.gov.za"),
    "Forestry": ("DFFE", "forestry@dffe.gov.za", "+27 12 399 9000", "www.dffe.gov.za"),
    "Energy": ("DMRE", "energy@dmre.gov.za", "+27 12 444 3000", "www.dmre.gov.za"),
    "Transportation": ("Dept. of Transport", "info@dot.gov.za", "+27 12 309 3000", "www.transport.gov.za"),
    "Geology": ("Council for Geoscience", "info@geoscience.org.za", "+27 12 841 1000", "www.geoscience.org.za")
}

def generate_bbox_polygon(province, max_attempts=100):
    geom = province_geometries[province]
    minx, miny, maxx, maxy = geom.bounds
    for _ in range(max_attempts):
        width = random.uniform(0.2, 0.8)
        height = random.uniform(0.2, 0.6)
        xmin = random.uniform(minx, maxx - width)
        ymin = random.uniform(miny, maxy - height)
        xmax = xmin + width
        ymax = ymin + height
        candidate_box = box(xmin, ymin, xmax, ymax)
        if geom.contains(candidate_box.centroid):
            return candidate_box, xmin, ymin, xmax, ymax
    raise ValueError(f"Could not create bbox in {province}")

# Build data
records = []
geometries = []
category_counts = {cat: 0 for cat in categories}
max_per_category = 30
provinces = list(province_geometries.keys())

while len(records) < 400:
    available = [cat for cat, c in category_counts.items() if c < max_per_category]
    if not available:
        break

    category = random.choice(available)
    province = random.choice(provinces)

    try:
        bbox_poly, min_lon, min_lat, max_lon, max_lat = generate_bbox_polygon(province)
        created = fake.date_time_between(start_date='-5y', end_date='now')
        org, email, phone, site = organizations.get(
            category, ("SA Government", "info@gov.za", "+27 12 000 0000", "www.gov.za")
        )

        record = {
			"id": len(records) + 1,
			"identifier": ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=10)),  # ✅ Added
			"title": f"{province} {category}",
			"description": (
				f"{categories[category]} The data is specific to the province of {province}, focusing on localized trends and challenges. "
				f"It supports evidence-based decision making and includes owner institution, contacts, timestamps, and spatial geometry."
			)[:254],
			"category": category,
			"owner": org,
			"province": province,
			"created": created.strftime('%Y-%m-%d %H:%M:%S'),
			"thumb_url": "https://w7.pngwing.com/pngs/328/403/png-transparent-metadata-management-computer-icons-symbol-symbol-miscellaneous-text-logo-thumbnail.png",
			"email": email,
			"phone": phone,
			"website": site,
			"min_lon": min_lon,
			"min_lat": min_lat,
			"max_lon": max_lon,
			"max_lat": max_lat
		}

        records.append(record)
        geometries.append(bbox_poly)
        category_counts[category] += 1

    except ValueError as e:
        print(f"Skipping: {e}")
        continue

# Save JSON
json_path = "south_africa_metadata.json"
with open(json_path, "w") as f:
    json.dump(records, f, indent=4)
print(f"JSON file generated: {json_path}")

# Save Shapefile (with bounding box polygon geometry)
gdf = gpd.GeoDataFrame(records, geometry=geometries)
gdf.set_crs(epsg=4326, inplace=True)

# Rename long fields for shapefile compliance (max 10 chars)
gdf = gdf.rename(columns={
    "description": "descriptio",
    "created": "created_at",
    "thumb_url": "thumbnail",
    "email": "contact_em",
    "phone": "contact_ph",
    "identifier": "identifier"  # ✅ optional short name
})


shapefile_path = "metadata.shp"
gdf.to_file(shapefile_path)
print(f"Shapefile generated: {shapefile_path}")

