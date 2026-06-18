# Quick Installation Guide

## 1. Clone the Repository

```bash
git clone git@github.com:SANSA-DSM-PROJECTS/SAEOSS2.git
cd saeoss
```

---

## 2. Build and Start Docker Containers

```bash
docker compose build --no-cache
docker compose up -d
```

After the containers start successfully, access the application at:

```text
http://localhost:8085
```

---

## 3. Copy Sample Metadata into PostgreSQL Container

```bash
docker cp Data/metadata postgres:/tmp/
```

---

## 4. Populate Sample Metadata

Access the PostgreSQL container:

```bash
docker exec -it postgres bash
```

Install PostGIS tools if not already installed:

```bash
apt-get update
apt-get install -y postgis
```

Import the shapefile into PostgreSQL:

```bash
shp2pgsql -I -s 4326 /tmp/metadata/metadata.shp metadatas | psql -U username -d datastore
```

---

## 5. If an Error Occurs During Import

Open PostgreSQL:

```bash
psql -U username -d datastore
```

Drop the existing table:

```sql
DROP TABLE metadatas;
```

Exit PostgreSQL:

```sql
\q
```

Re-import the shapefile:

```bash
shp2pgsql -I -s 4326 /tmp/metadata/metadata.shp metadatas | psql -U username -d datastore
```

---

## Notes

* Replace `username` with your PostgreSQL username.
* Ensure Docker and Docker Compose are installed before starting.
* Confirm that the `postgres` container is running before importing metadata.
* Verify port `8085` is not already in use on your machine.


