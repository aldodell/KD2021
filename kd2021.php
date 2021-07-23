<?php

/***
 * KD PHP framework
 * June 2021
 */
class KDPDO
{
    public $connection;
    public $data = null;
    public $lastInsertId = null;
    private $OK = "OK";
    private $INVALID = "INVALID";
    public $root = "root";


    public function __construct($connection, $datasetName)
    {
        $this->connection = $connection;
        if (isset($_REQUEST[$datasetName])) {
            $this->data = json_decode($this->fromBase64($_REQUEST[$datasetName], true));
        }
    }

    public function getParameter($name)
    {

        $r = $this->INVALID;
        if (isset($_REQUEST[$name])) {
            $r = $_REQUEST[$name];
        }

        return $r;
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




class KDPDO2
{
    public $connection;
    public $sql_insert;
    public $sql_update;
    public $sql_delete;
    public $sql_select;
    public $data = null;

    private $OK = "OK";
    private $INVALID = "INVALID";

    public function __construct($connection)
    {
        $this->connection = $connection;
    }



    public function getData($dataName)
    {
        if (isset($_REQUEST[$dataName])) {
            $this->data = json_decode($this->fromBase64($_REQUEST[$dataName]));
        }
    }

    public function getParameter($commandName)
    {
        $r = $this->INVALID;
        if (isset($_REQUEST[$commandName])) {
            $r = $_REQUEST[$commandName];
        }
        return $r;
    }


    /**
     * Perform INSERT SQL statement
     * return last id
     */
    public function insert()
    {
        try {
            $stmt = $this->connection->prepare($this->sql_insert);
            if ($this->data !== null) {
                $stmt->execute($this->data);
            } else {
                $stmt->execute();
            }
            $id =  $this->connection->lastInsertId();
            return $id;
        } catch (PDOException $e) {
            echo "Error inserting: " . $e->getMessage();
            die();
        }
    }



    public function update()
    {
        try {
            foreach ($this->data as $row) {
                $row = (array)$row;
                $stmt = $this->connection->prepare($this->sql_update);
                $stmt->execute($row);
            }
            return $this->OK;
        } catch (PDOException $e) {
            echo "Error updating: " . $e->getMessage();
            die();
        }
    }


    public function delete()
    {
        try {
            foreach ($this->data  as $row) {
                $row = (array)$row;
                $stmt = $this->connection->prepare($this->sql_delete);
                $stmt->execute($row);
            }
            return $this->OK;
        } catch (PDOException $e) {
            echo "Error deleting: " . $e->getMessage();
            die();
        }
    }


    public function select()
    {
        try {
            $stmt = $this->connection->prepare($this->sql_select);
            if ($this->data !== null) {
                $stmt->execute($this->data);
            } else {
                $stmt->execute();
            }
            $rows = $stmt->fetchAll(PDO::FETCH_NAMED);
            $json = json_encode($rows);
            return $json;
        } catch (PDOException $e) {
            echo "Error selecting: " . $e->getMessage();
            die();
        }
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


    public function appendData($key, $value)
    {
        // $this->data[] = {$key, $value};

    }
}


class KDCrypto
{
    private $phrases;

    public function __construct()
    {
        $this->phrases = [["ave", "Maria"], ["gratia", "plena"], ["Dominus", "tecum"], ["benedicta", "tu"], ["in", "mulieribus"]];
    }

    public function getParameter($name)
    {

        $r = $this->INVALID;
        if (isset($_REQUEST[$name])) {
            $r = $_REQUEST[$name];
        }

        return $r;
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
