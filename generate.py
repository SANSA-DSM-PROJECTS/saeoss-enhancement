import json
import random
import struct
import binascii
from datetime import datetime
from faker import Faker
import geopandas as gpd
from shapely.geometry import Point

fake = Faker()

# Load South Africa shapefile
shapefile_path = "../../Data/Data/Administrative_Boundaries/Province.shp"
sa_shape = gpd.read_file(shapefile_path)
sa_polygon = sa_shape.geometry.unary_union  # Fixed deprecated `union_all`

# Categories and provinces
categories = [
    "Water", "Climate Change", "Transportation", "Disaster Management",
    "Agriculture", "Energy", "Biodiversity", "Urban Planning", "Mining", "Forestry"
]

provinces = [
    "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State",
    "Limpopo", "Mpumalanga", "North West", "Northern Cape"
]

def generate_random_point_in_sa(max_attempts=1000):
    minx, miny, maxx, maxy = sa_polygon.bounds
    for _ in range(max_attempts):
        lon = random.uniform(minx, maxx)
        lat = random.uniform(miny, maxy)
        point = Point(lon, lat)
        if sa_polygon.contains(point):
            return lon, lat
    raise ValueError("Could not generate a point inside South Africa after max attempts.")

def point_to_wkb(lon, lat):
    wkb = (
        struct.pack('<B', 1) +
        struct.pack('<I', 1) +
        struct.pack('<d', lon) +
        struct.pack('<d', lat)
    )
    return binascii.hexlify(wkb).decode('utf-8')

# Generate records
records = []
geometries = []
for i in range(4000):
    category = random.choice(categories)
    province = random.choice(provinces)
    created_at = fake.date_time_between(start_date='-5y', end_date='now')
    lon, lat = generate_random_point_in_sa()
    point = Point(lon, lat)

    records.append({
        "id": i + 1,
        "title": f"{category} Data",
        "description": fake.paragraph(nb_sentences=3),
        "category": category,
        "owner": fake.name(),
        "province": province,
        "created_at": created_at.strftime('%Y-%m-%d %H:%M:%S'),
        "thumbnail": "https://w7.pngwing.com/pngs/328/403/png-transparent-metadata-management-computer-icons-symbol-symbol-miscellaneous-text-logo-thumbnail.png",
        "wkt_geometry": f"POINT ({lon} {lat})",
        "wkb_geometry": point_to_wkb(lon, lat),
        "lon": lon,
        "lat": lat
    })
    geometries.append(point)

# Save to JSON
json_path = "south_africa_metadata.json"
with open(json_path, "w") as f:
    json.dump(records, f, indent=4)
print("✅ JSON metadata file generated successfully at:", json_path)

# Create GeoDataFrame and save to shapefile
gdf = gpd.GeoDataFrame(records, geometry=geometries)
gdf.set_crs(epsg=4326, inplace=True)

shapefile_output_path = "south_africa_metadata.shp"
gdf.to_file(shapefile_output_path)
print("✅ Shapefile generated successfully at:", shapefile_output_path)

