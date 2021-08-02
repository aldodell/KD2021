<?php

class KDPHP
{
    private $OK = "OK";
    private $INVALID = "INVALID";

    public function getParameter($name)
    {

        $r = $this->INVALID;
        if (isset($_REQUEST[$name])) {
            $r = $_REQUEST[$name];
        }

        return $r;
    }

    public function hash($text)
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
            //echo $e;
            $d .= dechex($e);
        }

        $e = substr($d, 0, 2);
        $e = hexdec($e);
        $e = $e % count($b);
        return substr($d, $e, 16);
    }
}


/***
 * KD PHP framework
 * June 2021
 */
class KDPDO extends KDPHP
{
    public $connection;
    public $data = null;
    public $lastInsertId = null;
    public $root = "root";


    public function __construct($connection, $datasetName)
    {
        $this->connection = $connection;
        if (isset($_REQUEST[$datasetName])) {
            $this->data = json_decode($this->fromBase64($_REQUEST[$datasetName], true));
        }
    }

    public function query($sql)
    {
        try {
            $stmt = $this->connection->prepare($sql);

            if ($this->data !== null) {
                $stmt->execute($this->data);
            } else {
                $stmt->execute();
            }
            $rows = $stmt->fetchAll(PDO::FETCH_NAMED);
            return $rows;
        } catch (PDOException $e) {
            echo "Error quaerying: " . $e->getMessage() . "\nSQL=" . $sql;
            die();
        }
    }


    public function execute($sql)
    {
        try {
            $count = 0;
            if ($this->data === null) {
                $stmt = $this->connection->prepare($sql);
                $count = $stmt->execute();
            } else {
                if (!is_array($this->data)) {
                    $this->data =  array($this->data);
                }
                foreach ($this->data as $row) {
                    $row = (array)$row;
                    $stmt = $this->connection->prepare($sql);
                    $count += $stmt->execute($row);
                }
            }
            $this->lastInsertId = $this->connection->lastInsertId();
            return $count;
        } catch (PDOException $e) {
            echo "Error updating: " . $e->getMessage();
            die();
        }
    }


    public function send($data)
    {
        $r = json_encode($data);
        print_r($r);
    }


    public function fromBase64($bin)
    {
        return urldecode(base64_decode($bin));
    }

    public function toBase64($str)
    {
        return base64_encode(urlencode($str));
    }

    public function clearData()
    {
        $this->data = "";
        return $this;
    }
}


class KDCrypto extends KDPHP
{
    private $phrases;

    public function __construct()
    {
        $this->phrases = [["ave", "Maria"], ["gratia", "plena"], ["Dominus", "tecum"], ["benedicta", "tu"], ["in", "mulieribus"]];
    }


    public function getAWord()
    {
        $i = rand(0, count($this->phrases) - 1);
        return $this->phrases[$i][0];
    }

    public function checkPhrase($p)
    {
        $w = explode(" ", $p);
        foreach ($this->phrases as $v) {
            if ($v[0] == $w[0] && $v[1] == $w[1]) {
                return "true";
            }
        }
        return "false";
    }
}




/**
 * System files:
 * messageIndex                 | store a file with last message index
 * messageABCDEFGH               | each message is store on separeted files with hexadecimal numbers        
 * 
 */

class KDMessenger extends KDPHP
{
    private $messageSymbol = "m";
    private $messageIndexFileName = "/messages/messageIndex";
    private $messagePrefixFileName = "/messages/message";

    function catchMessage()
    {
        $message = $this->getParameter($this->messageSymbol);
        $message = json_decode($message);
    }

    function writeMessage($message)
    {
        $filename = $this->messagePrefixFileName . $this->incrementLastIndex();
        file_put_contents($filename, $message);
    }

    function readLastIndex()
    {
        $v = file_get_contents($this->messageIndexFileName);
        return $v;
    }


    function incrementIndex($index)
    {
        $t = str_split($index, 2);
        $a0 = hexdec($t[3]);
        $a1 = hexdec($t[2]);
        $a2 = hexdec($t[1]);
        $a3 = hexdec($t[0]);

        $a0++;
        if ($a0 == 256) {
            $a0 = 0;
            $a1++;
        }

        if ($a1 == 256) {
            $a1 = 0;
            $a2++;
        }

        if ($a2 == 256) {
            $a2 = 0;
            $a3++;
        }

        $h = str_pad(dechex($a3), 2, "0", STR_PAD_LEFT);
        $h = $h . str_pad(dechex($a2), 2, "0", STR_PAD_LEFT);
        $h = $h . str_pad(dechex($a1), 2, "0", STR_PAD_LEFT);
        $h = $h . str_pad(dechex($a0), 2, "0", STR_PAD_LEFT);

        return $h;
    }

    function incrementLastIndex()
    {
        $v = $this->readLastIndex();
        $h = $this->incrementIndex($v);
        file_put_contents($this->messageIndexFileName, $h);
        return $h;
    }

    function readMessagesBeginAt($index)
    {
    }
}


class KDMessagesQueue extends KDPHP
{
    private $messageSymbol = "m";
    private $messagesQueueFile = "messages/messages.json";



    public function append(KDMessage $message)
    {
        $f = "";
        if (!file_exists($this->messagesQueueFile)) {
            $f = "[" . $message->toString() . "]";
        } else {
            $f = file_get_contents($this->messagesQueueFile);
            $f = substr($f, 0, strlen($f) - 1) . "," . $message->toString() . "]";
        }
        file_put_contents($this->messagesQueueFile, $f,   LOCK_EX);
    }

    public function getMessages()
    {
        $r = file_get_contents($this->messagesQueueFile);
        $j = json_decode($r);
        print_r($j);
        $messages = [];
        foreach ($j as $m) {
            $message = KDMessage::fromJson($m);
            $messages[] = $message;
        }
        return $messages;
    }


    public function getMessagesOfProducer($producer, $from = "0")
    {
        $messages = $this->getMessages();
        $r = [];
        foreach ($messages as $m) {
            if ($m->producer == $producer && $m->date > $from) {
                $r[] = $m;
            }
        }
        return $r;
    }
}

class KDMessage extends KDPHP
{
    const messageSymbol = "m";

    public $destination;
    public $payload;
    public $origin;
    public $producer;
    public $consumer;
    public $date;

    public function __construct($destination = "", $payload = "", $origin = "", $producer = "", $consumer = "", $date = "")
    {
        $this->destination = $destination;
        $this->payload = $payload;
        $this->origin = $origin;
        $this->producer = $producer;
        $this->consumer = $consumer;
        if ($date == "") $date  = date("YmdHisu");
        $this->date = $date;
    }

    public static function fromJson($json)
    {
        $obj = json_decode($json, true);
        $m = new KDMessage();
        foreach ($m as $key => $value) {
            $m->{$key} = $obj[$key];
        }
        $m->date = date("YmdHisu");
        return $m;
    }

    public static function fromRequest()
    {
        $m = new KDMessage();
        $m = $m->getParameter(KDMessage::messageSymbol);
        $message = KDMessage::fromJson($m);
        return $message;
    }

    function getTokens()
    {
        $r = "/[\w\@\d\.]+/";
        preg_match_all($r, $this->payload, $matches);
        return $matches[0];
    }

    public function toString()
    {
        return json_encode($this);
    }

    /*
    public function toString()
    {
        $r = "";
        foreach (get_object_vars($this) as $key => $value) {
            $n = strpos($key, "message");
            if ($n !== 0) {
                $r .= "$key: $value\n";
            }
        }
        return $r;
    }
    */

    /*
    function writeMessage()
    {

        $filename = $this->messagePrefixFileName . $this->date;
        while (file_exists($filename)) {
            $last = substr($filename, -6);
            $last = intval($last);
            $last++;
            $filename = substr($filename, 0, strlen($filename) - 6);
            $filename .= $last;
        }
        file_put_contents($filename, $this->toString());
    }
    */
}




class KDUserExitsException extends Exception
{
    function __construct($fullName)
    {
        $this->message = "User $fullName exist. Try other";
    }
}

class KDUserNotExitsException extends Exception
{
    function __construct($fullName)
    {
        $this->message = "User $fullName does not exist. Try other";
    }
}

/**
 * User class
 */
class KDUser extends KDPHP
{

    protected $usersPath = "users/";
    public $name;
    public $organization;
    public $lastMessageIndex = 0;
    const generic = "generic";

    /**
     * Return a string with name + @ + organization
     */
    public function getFullName()
    {
        return $this->name . "@" . $this->organization;
    }

    /** Return file path */
    private function getCompletePath()
    {
        return $this->usersPath . $this->getFullName();
    }

    /**
     * Write user to store device
     */
    private function write()
    {
        file_put_contents($this->getCompletePath(), json_encode($this));
    }

    /**
     * Update last message index read by user
     */
    public function updateLastMessage($index)
    {
        try {
            $u = KDUser::read($this->name, $this->organization);
            $this->lastMessage = $index;
            $this->write();
        } catch (KDUserNotExitsException $ex) {
            return false;
        }
    }

    /**
     * Split full name into name and organization
     */
    public static function splitFullName($fullName, &$name, &$organization)
    {
        $name = substr($fullName, 0, strpos($fullName, "@"));
        $organization = substr($fullName, strlen($name) + 1);
    }

    /**
     * Read user data from store
     */
    public static function read($fullName)
    {
        $u = new KDUser($fullName);
        $filename = $u->usersPath . $u->getFullName();
        if (!file_exists($filename)) {
            throw new KDUserNotExitsException($u->getFullName());
        } else {
            $f = file_get_contents($filename);
            $j = json_decode($f, true);
            $u = new KDUser();
            $u->name = $j["name"];
            $u->organization = $j["organization"];
            return  $u;
        }
    }

    /**
     * User constructor.
     * If name is full (with organization), second argument are no mandatory.
     */
    function __construct($name = "guess", $organization = generic)
    {
        $p = strpos($name, "@");

        if ($p) {
            $organization = substr($name, $p + 1);
            $name = substr($name, 0, $p);
        }

        $this->name = $name;
        $this->organization = $organization;
    }

    /**
     * Create a user file if does not exist.
     */
    function create()
    {
        if (file_exists($this->getCompletePath())) {
            throw new KDUserExitsException($this->getFullName());
        } else {
            $this->write();
        }
    }
}
