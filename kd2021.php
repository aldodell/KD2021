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

class KDServer extends KDPHP
{
    private $messageSymbol = "m";

    function catchMessage()
    {
        $message = $this->getParameter($this->messageSymbol);
    }
    
}
