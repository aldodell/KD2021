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

    function __construct()
    {
        $this->create();
    }

    private function create()
    {
        if (!file_exists($this->messagesQueueFile)) {
            file_put_contents($this->messagesQueueFile, "");
        }
    }

    public function append(KDMessage $message)
    {
        file_put_contents($this->messagesQueueFile, $message->toString() . ",", FILE_APPEND | LOCK_EX);
    }

    public function getMessages()
    {
        $r = file_get_contents($this->messagesQueueFile);
        $r = "[ $r ]";
        $j = json_decode($r);
        $messages = [];
        foreach ($j as $m) {
            $message = KDMessage::fromJson($m);
            $messages[] = $message;
        }
        return $messages;
    }


    public function getMessagesOfConsumer($consumer, $from = "0")
    {
        $messages = $this->getMessages();
        $r = [];
        foreach ($messages as $m) {
            if ($m->consumer == $consumer && $m->date > $from) {
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

    function tokens()
    {
        $r = "/\w+|\d+|\(|\)|\|!|\?|\*|\./";
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
        $this->message = "User $fullName exits. Try other";
    }
}

class KDUserNotExitsException extends Exception
{
    function __construct($fullName)
    {
        $this->message = "User $fullName exits. Try other";
    }
}

class KDUser extends KDPHP
{

    protected $usersPath = "users/";
    public $name;
    public $organization;
    public $lastMessageIndex = 0;
    const generic = "generic";

    public function fullName()
    {
        return $this->name . "@" . $this->organization;
    }

    private function completePath()
    {
        return $this->usersPath . $this->fullName();
    }

    private function write()
    {
        file_put_contents($this->completePath(), json_encode($this));
    }

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


    public static function splitFullName($fullName)
    {
        $name = substr($fullName, 0, strpos($fullName, "@"));
        $organization = substr($fullName, strlen($name) + 1);
        $r[0] = $name;
        $r[1] = $organization;
        return $r;
    }


    public static function readByFullName($fullName)
    {
        $r = KDUser::splitFullName($fullName);
        $u = KDUser::read($r[0], $r[1]);
        return $u;
    }

    public static function read($name, $organization)
    {
        $u = new KDUser($name, $organization);
        $filename = $u->usersPath . $u->fullName();
        if (!file_exists($filename)) {
            throw new KDUserNotExitsException($u->fullName());
        } else {
            $f = file_get_contents($filename);
            $u = json_decode($f);
            return $u;
        }
    }

    function __construct($name, $organization = generic)
    {
        $this->name = $name;
        $this->organization = $organization;
    }

    function create()
    {
        if (file_exists($this->completePath())) {
            return false;
        }
        $this->write();
    }
}
