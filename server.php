<?php
include("kd2021.php");

/**
 * KicsyDell Server
 * version 1.0 2021/July
 * 
 */



$kdphp = new KDPHP();
const messageSymbol = "m";

//Get request from user:
$message = KDMessage::fromRequest(messageSymbol);
echo $message->toString();
