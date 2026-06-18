<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateImpactTable extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('impact')) {
            Schema::create('impact', function (Blueprint $table) {
                $table->id();
                $table->string('area');
                $table->text('impact');
                $table->date('date');
                $table->string('province');
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('impact');
    }
}
