<?php


/**
 * KD Server 2002 version
 * 
 * Notes:
 * 1. Messages send to client must have "answer" word at first payload terms to show on
 * UI app like terminal
 * 
 * 
 * 
 */
//Message symbol to retrieve
const messageSymbol = "m";
const serverVersion = "KD Server 2022 (1.0) beta";


/**
 * Class Message
 */
class KDMessage
{

    public $origin;
    public $destination;
    public $producer;
    public $consumer;
    public $payload;
    public $date;


    /** 
     * Create function from POST request
     * */
    public static function fromJson($json)
    {
        $obj = json_decode($json, true);
        $message = new KDMessage();
        $message->origin = $obj["origin"];
        $message->destination = $obj["destination"];
        $message->producer = $obj["producer"];
        $message->consumer = $obj["consumer"];
        $message->payload = $obj["payload"];
        $message->date = $obj["date"];
        return $message;
    }

    /**
     * Get tokens array
     */
    function tokens()
    {
        return preg_split("/\s+/", $this->payload);
    }

    /**
     * @return KDMessage when origin and destination are switches, and consumer and producer as well.
     */
    function reply()
    {
        $r = new KDMessage();
        $r->origin = $this->destination;
        $r->destination = $this->origin;
        $r->producer = $this->consumer;
        $r->consumer = $this->producer;
        $r->payload = "";
        $r->date =  date("YmdHisu");
        return $r;
    }

    function toString()
    {
        $r = json_encode($this);
        return $r;
    }
}



/**
 * User Class
 */
class KDUser
{
    const usersPath = "users/";
    public $name;
    public $organization;
    public $authorizedApplications;


    /**
     * if text == null return current name like john@mycompany.
     * If text has a name as john@mycompany explode it into parts.
     */
    function fullName($text = "")
    {
        if ($text != "") {
            $t = explode("@", $text);
            $this->name = $t[0];
            $this->organization = $t[1];
        }
        return "$this->name@$this->organization";
    }

    function create()
    {
        $fullName = $this->fullName();
        $p = $this::usersPath . $fullName;
        if (!file_exists($p)) {
            $this->save();
        } else {
            throw new Exception("Error The user $fullName exists.");
        }
    }

    function save()
    {
        $fullName = $this->fullName();
        $p = $this::usersPath . $fullName;
        $obj = json_encode($this);
        $context = stream_context_create();
        file_put_contents($p, $obj, 0, $context);
        return "The user $fullName was saved successfully.";
    }

    function load($fullName)
    {
        $p = $this::usersPath . $fullName;
        if (!file_exists($p)) {
            throw new Exception("The user $fullName does not exits.");
        } else {
            $context = stream_context_create();
            $file =  file_get_contents($p, false, $context);
            $obj = json_decode($file);
            $this->name = $obj->name;
            $this->organization = $obj->organization;
            $this->authorizedApplications = $obj->authorizedApplications;
        }
    }
}




/**
 * PROCCESSING AREA
 */

//Get message as string from post request
$json = $_POST[messageSymbol];

//Proccess message as JSON object
$message = KDMessage::fromJson($json);

//Get tokens from message
$tokens = $message->tokens();

//Get first token as command:
$command = $tokens[0];


switch ($command) {

    case "ping":
        $m = $message->reply();
        $m->origin = "server";
        $m->payload = "answer " . serverVersion;
        echo $m->toString();
        break;

    case "user_create":
        $user = new KDUser();
        $user->fullName($tokens[1]);
        $r = "";
        try {
            $r = $user->create();
        } catch (Exception $ex) {
            $r = $ex->getMessage();
        }
        $m = $message->reply();
        $m->origin = "server";
        $m->payload = "answer $r";
        echo $m->toString();

        break;

    case "user_authorize_application":
        $user = new KDUser();
        $r = "";
        try {
            $r = $user->load($tokens[1]);
            $user->authorizedApplications[] = $tokens[2];
            $user->save();
        } catch (Exception $ex) {
            $r = $ex->getMessage();
        }

        $m = $message->reply();
        $m->origin = "server";
        $m->payload = "answer $r";
        echo $m->toString();

        break;
}
