<?php

/**
 * PHP utils tools
 */
class KDPHP
{
    private $OK = "OK";
    private $INVALID = "INVALID";
    public const TOKENS = "/[\w\@\d\.\*]+/";

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
            $d .= dechex($e);
        }

        $e = substr($d, 0, 2);
        $e = hexdec($e);
        $e = $e % count($b);
        return substr($d, $e, 16);
    }
}



/**
 * PHP Data Object model for KD
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
                    $this->data = array($this->data);
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
            echo "Error executing: " . $e->getMessage();
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
 * Message handler queue class
 */
class KDMessagesQueue extends KDPHP
{
    private $messageSymbol = "m";
    public $path = "messages/";


    private function fileName($message)
    {
        return $this->path . $this->messageSymbol . "_" . $message->consumer . "_" . $message->date;
    }

    function append($message)
    {
        $message->date = date("YmdHisu");
        $filename = $this->fileName($message);
        $s = json_encode($message);
        file_put_contents($filename, $s);
    }

    function getMessagesOfConsumer($consumer, $lastIndex)
    {
        $files = scandir($this->path);
        $r = [];
        foreach ($files as $file) {
            if (substr($file, 0, 1) != ".") {
                $i = strpos($file, "_", 0);
                $j = strpos($file, "_", $i + 1);
                // $k = strpos($file, "_", $j + 1);
                $c = substr($file, $i + 1, $j - $i - 1);
                $d = substr($file, $j + 1);

                if ($consumer == $c && $d > $lastIndex) {
                    $m = KDMessage::fromFile($this->path . $file);
                    $r[] = $m;
                }
            }
        }
        if (count($r) == 0) {
            return "false";
        }
        $s = json_encode($r);
        return $s;
    }

    function deleteMessage($message)
    {
        $filename = $this->fileName($message);
        try {
            unlink($filename);
        } catch (Exception $ex) {
            die($ex);
        }
    }
}

/**
 * Message wrapper
 */
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
        return KDMessage::fromArray($obj);
    }

    /** Build a message object from an array
     * parts:
     *          destination
     *          payload
     *          origin
     *          producer
     *          consumer
     *          date
     */
    public static function fromArray($obj)
    {
        $m = new KDMessage($obj["destination"], $obj["payload"], $obj["origin"], $obj["producer"], $obj["consumer"], $obj["date"]);
        //  $m->date = date("YmdHisu");
        return $m;
    }


    public static function fromRequest()
    {
        $m = new KDMessage();
        $m = $m->getParameter(KDMessage::messageSymbol);
        $message = KDMessage::fromJson($m);
        return $message;
    }

    public static function fromFile($filename)
    {
        // die($filename);
        if (file_exists($filename)) {
            $f = file_get_contents($filename);
            $m = KDMessage::fromJson($f);
            return $m;
        }
        return false;
    }

    public function saveTo($filename)
    {
        file_put_contents($filename, $this->toString());
    }

    function getTokens()
    {
        preg_match_all($this::TOKENS, $this->payload, $matches);
        return $matches[0];
    }

    public function toString()
    {
        return json_encode($this);
    }


    function reducePayload()
    {
        $tokens = $this->getTokens();
        $r = $tokens[0];
        $this->payload = trim(substr($this->payload, strlen($r) + 1));
        return $r;
    }
}


class KDUserExistException extends Exception
{
    function __construct($fullName)
    {
        $this->message = "User $fullName exist. Try other";
    }
}

class KDUserNotExistException extends Exception
{
    function __construct($fullName)
    {
        $this->message = "User $fullName does not exist. Try other";
    }
}

class KDUserPasswordWrongException extends Exception
{
    function __construct($fullName)
    {
        $this->message = "User $fullName does not conform with password.";
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
    public $lastMessageDate = 0;
    public $hashPassword;
    public $authorizedApplications = [];
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

    public static function addApplication($userFullName, $applicationName)
    {
        $u = KDUser::read($userFullName);
        if ($u->authorizedApplications == null) {
            $u->authorizedApplications = [];
        }
        if (!in_array($applicationName, $u->authorizedApplications)) {
            $u->authorizedApplications[] = $applicationName;
            $u->write();
        }
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
    public function updateLastDate($date)
    {
        try {
            //$u = KDUser::read($this->name, $this->organization);
            $this->lastMessageDate = $date;
            $this->write();
        } catch (KDUserExistException $ex) {
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
            throw new KDUserNotExistException($u->getFullName());
        } else {
            $f = file_get_contents($filename);
            $j = json_decode($f, true);
            $u = new KDUser();
            $u->name = $j["name"];
            $u->organization = $j["organization"];
            $u->hashPassword =  $j["hashPassword"];
            $u->lastMessageDate = $j["lastMessageDate"];
            $u->authorizedApplications = $j["authorizedApplications"];
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
            throw new KDUserExistException($this->getFullName());
        } else {
            $this->write();
        }
    }

    public function toString()
    {
        return json_encode($this);
    }

    public static function fromMessage($message)
    {
        $fullname = $message->getFullName();
        $u = KDUser::read($fullname);
        return $u;
    }
}
