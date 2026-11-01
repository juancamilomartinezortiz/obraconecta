<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialty_id')->constrained();
            $table->foreignId('city_id')->constrained();
            $table->string('title');
            $table->text('description');
            $table->string('address')->nullable();
            $table->unsignedBigInteger('budget')->nullable();
            $table->enum('budget_type', ['total', 'daily', 'm2'])->default('total');
            $table->date('start_date')->nullable();
            $table->unsignedSmallInteger('days')->nullable();
            $table->unsignedTinyInteger('workers_needed')->default(1);
            $table->enum('status', ['open', 'paused', 'closed'])->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_posts');
    }
};
