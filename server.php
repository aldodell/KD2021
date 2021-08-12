<?php
include("kd2021.php");

/**
 * KicsyDell Server
 * version 1.0 2021/July
 * 
 */

$kdphp = new KDPHP();
const messageSymbol = "m";
const generic = "generic";
const serverVersion = "KD Server 1.0 (alpha) 2021\n";

//Get request from user:
$message = KDMessage::fromRequest(messageSymbol);



//Filter messages to system:
if ($message->destination == "server") {
    $message->date  = date("YmdHisu");
    $tokens = $message->getTokens();

    switch ($tokens[0]) {
        case "ping":
            echo serverVersion;
            break;

            /**
             * 
             * retrieve messages via
             * the producer of the message that made the call to getMessages
             */
        case "getMessages":

            $u = KDUser::read($message->consumer);
            $index = $u->lastMessageIndex;
            $qm = new KDMessagesQueue();
            $msgs = $qm->getMessagesOfConsumer($u->getFullName(), $index);
            echo $msgs;
            break;


        case "create":
            //Create a new user
            if ($tokens[1] == "user") {
                $fullName = $tokens[2];
                if ($fullName == null) {
                    $fullName = $message->producer;
                }
                $u = new KDUser($fullName);
                $u->hashPassword = $message->hash($tokens[3]);
                try {
                    $u->create();
                } catch (KDUserExistException $ex) {
                    die($ex->getMessage());
                }
            }
            break;

        case "login":
            $fullName = $tokens[1];
            $hashPassword = $tokens[2];
            try {
                $u = KDUser::read($fullName);
            } catch (KDUserNotExistException $ex) {
                die("NO");
            }
            if ($u->hashPassword == $hashPassword) {
                echo $u->toString();
            } else {
                $m = new KDMessage("terminal", "Password wrong!", "server", "", "");
                echo $m->toString();
            }
            break;


        case "authorize": //server authorize app to user
            if ($tokens[2] == "to") {
                $applicationName = $tokens[1];
                $userFullName = $tokens[3];
                KDUser::addApplication($userFullName, $applicationName);
                echo "$applicationName authorized to $userFullName\n";
            }
            break;


        default:
            $qm = new KDMessagesQueue();
            $message->destination = $message->reducePayload();
            $qm->append($message);
            break;
    }
}
