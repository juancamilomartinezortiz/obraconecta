<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('worker_profile_id')->constrained()->cascadeOnDelete();
            $table->text('message')->nullable();
            $table->unsignedBigInteger('rate')->nullable();
            $table->enum('status', ['sent', 'seen', 'accepted', 'rejected'])->default('sent');
            $table->boolean('is_invitation')->default(false);
            $table->timestamps();
            $table->unique(['job_post_id', 'worker_profile_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
