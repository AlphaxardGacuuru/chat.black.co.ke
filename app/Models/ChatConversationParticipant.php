<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ChatConversationParticipant extends Pivot
{
    public $incrementing = true;

    protected $casts = [
        'last_read_at' => 'datetime',
    ];
}
