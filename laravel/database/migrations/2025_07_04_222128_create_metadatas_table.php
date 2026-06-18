<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // ✅ Enable PostGIS extension (if not already)
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');

        Schema::create('metadatas', function (Blueprint $table) {
			$table->id();
			$table->string('identifier')->nullable()->unique();

			$table->string('title', 255);
			$table->text('descriptio')->nullable();
			$table->text('category')->nullable();
			$table->string('owner')->nullable();
			$table->string('province')->nullable();

			$table->string('contact_em')->nullable();
			$table->string('contact_ph')->nullable();
			$table->string('website')->nullable();
			$table->string('thumbnail')->nullable();

			$table->double('min_lon')->nullable();
			$table->double('min_lat')->nullable();
			$table->double('max_lon')->nullable();
			$table->double('max_lat')->nullable();

			$table->timestamp('created_at')->nullable();
			$table->timestamp('updated_at')->nullable();

		});

		// ✅ Add the PostGIS column and index manually
		DB::statement("ALTER TABLE metadatas ADD COLUMN geom geometry(MultiPolygon, 4326)");
		DB::statement("CREATE INDEX metadatas_geom_idx ON metadatas USING GIST (geom)");

    }

    public function down(): void
    {
        Schema::dropIfExists('metadatas');
    }
};

