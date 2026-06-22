<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create("organisation", function (Blueprint $table) {
            $table->string("identifier")->primary();
            $table->string("organisation");
            $table->string("alias")->nullable();
            $table->text("description")->nullable();
            $table->string("director")->nullable();
            $table->string("type")->nullable();
            $table->string("contact_email")->nullable();
            $table->string("contact_phone")->nullable();
            $table->string("website")->nullable();
            $table->string("logo")->nullable();
            // No timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("organisation");
    }
};
