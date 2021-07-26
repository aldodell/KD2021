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
