<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RequestStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public $gid;
    public $status;
    public $notes;

    public function __construct($gid, $status, $notes)
    {
        $this->gid = $gid;
        $this->status = $status;
        $this->notes = $notes;
    }

    public function build()
    {
        return $this->subject("Your Request #{$this->gid} Status Updated")
                    ->markdown('emails.requests.status_updated');
    }
}

