<?php

use KDMessage as GlobalKDMessage;
use KDUser as GlobalKDUser;

/**
 * KD Server 2002 version
 * 
 * Notes:
 * 1. Messages send to client must have "answer" word at first payload terms to show on
 * UI app like terminal
 * 
 * Uses:
 * 
 * 
 * 1. Ping with server, on terminal: 
 * server request any ping.
 *      "any" is de consumer. 
 * 
 * 2. Create a user, on terminal:
 *  server request any user_create user@organization password
 * 
 * 3. Authorizing an user to use some application: 
 * server request any user_authorize_application user@organization theApp
 * 
 * 
 * 
 * 
 */
//Message symbol to retrieve
const messageSymbol = "m";
const serverVersion = "KD Server 2022 (1.0) beta";
const KD_UP = "UP";
const KD_DOWN = "DOWN";


/**
 * Class Message
 */
class KDMessage
{

    const prefix = "m_";
    public $origin;
    public $destination;
    public $producer;
    public $consumer;
    public $payload;
    public $direction;
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
        $message->direction = $obj["direction"];
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
    function reply($answer)
    {
        $r = new KDMessage();
        $r->origin = $this->destination;
        $r->destination = $this->origin;
        $r->producer = $this->consumer;
        $r->consumer = $this->producer;
        $r->direction = KD_DOWN;
        $r->payload = $answer;
        $r->date =  date("YmdHisu");
        return $r;
    }

    function toString()
    {
        $r = json_encode($this);
        return $r;
    }

    function save()
    {
        $fileName = $this::prefix . $this->date;
        $context = stream_context_create();
        file_put_contents($fileName, $this->toString(), 0, $context);
        return "The user $fileName was saved successfully.";
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
    public $authorizedApplications = [];
    public $hashPassword;
    public $lastIndexMessage = 0;


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


    public static function hash($text)
    {
        $b = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241];

        for ($i = 0; $i < strlen($text); $i++) {
            $c = ord(substr($text, $i, 1));
            for ($j = 0; $j < count($b); $j++) {
                $b[$j] *= $c;
                $b[$j] %= 251;
            }
        }

        $d = "";
        foreach ($b as $e) {
            $d .= dechex($e);
        }

        $e = substr($d, 0, 2);
        $e = hexdec($e);
        $e = $e % count($b);
        return substr($d, $e, 16);
    }

    function create($password)
    {
        $fullName = $this->fullName();
        $p = $this::usersPath . $fullName;
        $this->hashPassword = $this::hash($password);

        if (!file_exists($p)) {
            return "Creating $fullName user.\n" . $this->save();
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
            $this->hashPassword = $obj->hashPassword;
        }
    }
}

class KDMessagesManager
{
    const path = "messages/";
    public $lastId = 0;

    function indexFileName()
    {
        return $this::path . "index";
    }

    /**
     * Build this class, and create index file on messasges path.
     */
    function __construct()
    {
        $f = $this->indexFileName();

        //if index does not exists create it.
        if (!file_exists($f)) {
            file_put_contents($f, "0");
        } else {
            $this->lastId = (int)file_get_contents($f);
        }
    }


    /**
     * Get all messages starting at parameter index for a user, or for all if user are any
     */
    function getMessages($startingId)
    {
        $index = (int)$startingId;
    }

    function getLastIndex()
    {

        return (int)file_get_contents($this->indexFileName());
    }

    /**
     * Increment last index message
     * @return last index before increment
     */
    function incrementLastIndex()
    {
        $i = $this->getLastIndex();
        file_put_contents($this->indexFileName(), $i + 1);
        return $i;
    }

    /**
     * Put a message into queue
     */
    function put($message)
    {
        $i = $this->incrementLastIndex(); //Get current index and increment it
        $fileName = $this::path . KDMessage::prefix  . $i . "_" . $message->consumer;
        file_put_contents($fileName, $message->toString());
    }
}

/**
 * PROCCESSING AREA
 */

$messageManager = new KDMessagesManager();

//Get message as string from post request
$json = $_POST[messageSymbol];

//Proccess message as JSON object
$message = KDMessage::fromJson($json);

//Get tokens from message
$tokens = $message->tokens();

//Get first token as command:
$command = $tokens[0];


switch ($command) {

        //server ping
    case "ping":
        echo $message->reply(serverVersion)->toString();
        break;

        /**
         * Order from terminal:
         * server request producer put destination payload 
         */
        //server request person@org put Hello world! This is a test.
    case "put":
        $m = $message;
        $m->destination = $tokens[1];
        $m->payload = substr($message->payload, strlen($command) + strlen($m->destination) + 2);
        $messageManager->put($m);
        break;

        /**
         * server request some@body user_create user@org password
         */
    case "user_create":
        $user = new KDUser();
        $user->fullName($tokens[1]);
        $r = "";
        try {
            $r = $user->create($tokens[2]);
        } catch (Exception $ex) {
            $r = $ex->getMessage();
        }
        echo $message->reply($r)->toString();
        break;

    case "user_authorize_application":
        $user = new KDUser();
        $userFullName = $tokens[1];
        $app = $tokens[2];
        $r = "";
        try {
            $user->load($userFullName);
            $user->authorizedApplications[] = $app;
            $user->save();
            $r = "The user $userFullName was grated with $app permission.";
        } catch (Exception $ex) {
            $r = $ex->getMessage();
        }

        echo $message->reply($r)->toString();
        break;

    case "user_login":
        $userFullName = $tokens[1];
        $hashPassword = $tokens[2];
        $user = new KDUser();
        $user->load($userFullName);
        $m = $message;
        $m->direction = KD_DOWN;

        if ($user->hashPassword == $hashPassword) {
            $m->destination = "login";
            $m->payload = "$userFullName  " . implode(" ", $user->authorizedApplications);
        } else {
            $m->destination = "server";
            $m->payload = "The user $userFullName  does not exits or password are wrong!";
        }
        
        echo $m->toString();
        break;

    case "getMessages":

        break;
}
