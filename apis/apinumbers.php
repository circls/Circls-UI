<?php

/**
 * API numbers framework front controller.
 * 
 * @package api-framework
 * @author  Urs Rueedi  ur@circls.co
 */

$headers = getallheaders();
if($headers['Access-Control-Request-Headers']) {
    header('Access-Control-Allow-Credentials:true');
    header('Access-Control-Allow-Headers:accept, content-type, x-auth-token, x-kazoo-cluster-id');
    header('Access-Control-Allow-Methods:GET, POST, PUT, PATCH, DELETE, OPTIONS, DELETE');
    header('Access-Control-Allow-Origin:*');
} else {
    header('Access-Control-Allow-Credentials:true');
    header('Access-Control-Allow-Headers:accept, content-type, x-auth-token, x-kazoo-cluster-id');
    header('Access-Control-Allow-Methods:GET, POST, PUT, PATCH, DELETE, OPTIONS, DELETE');
    header('Access-Control-Allow-Origin:*');
    header('Content-Type, X-Auth-Token, X-Request-ID, X-Kazoo-Cluster-ID, Location, Etag, ETag');
//    header('access-control-allow-headers: content-type,x-auth-token');
//    header('vary: accept');
}


$host=false;
/* --------------------- */
$HTTP="http://";         /* define http is only supported now */
$hosts = 'localhost';    /* define one or more couchdb hosts by whitespace (if one node is down is takes next... */
$dbport="15984";          /* define dbport default 5984 */
$testsleep=15;           /* loop between next try all hosts */
$diffcheck=(3600*24*60); /* diffcheck between new externel check */
/* --------------------- */

/* get differend http request methodes */
$cfg = array('url_kazoo' => 'http://localhost:8000'
            ,'usr_kazoo' => 'adminuc1'
            ,'pwd_kazoo' => 'kucipak001'
            ,'realm_kazoo' => 'sip.uc1.mycircls.com');
$debug = 0; /* debug in /tmp/numbers_debug/time() */
$request = new stdClass();

if ($_GET['request'] == $_GET['searchNumbers'] || $_GET['request'] == $_GET['searchCountries']) {

    require_once('functions.php');
    require_once('phplib/Sag.php');
    $host = get_dbhost($hosts, false);
    $sag = new Sag($host, $dbport);

    $request->method = strtoupper($_SERVER['REQUEST_METHOD']);
    switch ($request->method) {
        case 'GET':
            parse_str(file_get_contents('php://input'), $request);
            $request = json_decode(json_encode($_GET));
            $request->kazoo_auth = check_auth($headers);
        break;
        case 'OPTIONS':
            exit();
        break;
        case 'POST':
            $request = json_decode(file_get_contents('php://input'));
            $request->kazoo_auth = check_auth($headers);
//        parse_str(file_get_contents('php://input'), $request);
//        $request = array_merge($request, $_POST);
        break;
        case 'PUT':
            parse_str(file_get_contents('php://input'), $request);
            $request->kazoo_auth = check_auth($headers);
//        $request = array_merge($request, $_PUT);
        break;
        case 'DELETE':
            parse_str(file_get_contents('php://input'), $request);
            $request->kazoo_auth = check_auth($headers);
//        $request = array_merge($request, $_DELETE);
        break;
    }

/**
 * check authentication use apikey.
 */

    if($request->kazoo_auth) {
        // load kazoo-php-sdk
        require_once "kazoo-php-sdk/lib/Kazoo/Client.php";
        $options = array('base_url' => $cfg['url_kazoo']);
        $auth = new \Kazoo\AuthToken\User($cfg['usr_kazoo'], $cfg['pwd_kazoo'], $cfg['realm_kazoo']);
        $sdk = new \Kazoo\Client($auth, $options);

        switch ($request->type) {
            case 'searchCountries': $ret = all_countries($request); break;
            case 'search': $ret = search_numbers($request); break;
            case 'searchBlocks': $ret = search_numbers($request); break;
            default: $ret = error_numbers($request);
        }
        if($ret != FALSE && $request->kazoo_auth) {
            header('Content-Type: application/json');
            $response_str = $ret;
        } else {
            header('HTTP/1.1 401 get answer failed');
            $response_str = 'Type: '.$request->type.' Failed to get answer from numbers';
        }
    } else {
        header('HTTP/1.1 403 auth or token wrong');
        $response_str = error_numbers($request);
    }

}
    //file_put_contents("test.txt" ,json_encode($request));
    if($debug) {
        @mkdir("/tmp/numbers_debug");
        file_put_contents('/tmp/numbers_debug/'.time(),
            '$_GET: '.json_encode($_GET)."\n".
            '$_request: '.json_encode($request)."\n".
            '$_response_str: '.json_encode($response_str)
        );
    }
    echo json_encode($response_str);

// --------------Functions ---------------------

/**
 * odoo view countrys functions
 */

function all_countries()
{
global $sdk;

$json = '{
    "data": {
	"CH": {
	    "local": true,
	    "toll_free": [ "0800", "0801" ],
	    "vanity": false,
	    "prefix": 41,
	    "name": "Schweiz"
	},
	"DE": {
	    "local": true,
	    "toll_free": [ "0800" ],
	    "vanity": false,
	    "prefix": 49,
	    "name": "Deutschland"
	}
    }
}';
return(json_decode($json));
}

/**
 * kazoo search functions
 */

function search_numbers($request)
{
    global $sdk;

    $numbers_obj = $sdk->accounts()->phone_numbers()->retrieve();
    foreach($numbers_obj as $num){
        $j_obj = json_decode($num->toJSON());
        $numbers[$j_obj->id] = $j_obj;
    }
    foreach($numbers as $num_obj){
        if($num_obj->state == 'reserved' && preg_match('/%2B'.$request->country.$request->prefix.'.*/',$num_obj->id)) {
            $num_obj->number = str_replace('%2B',"+",$num_obj->id);
            // if search blocks look +size entry also
            if($request->size > 1) {
                $provdata[$num_obj->id] = $num_obj;
                $inrange=true;
                for($i=1;$i<$request->size;$i++) {
                    $next = substr($num_obj->id, 0, -3).substr('000'.(substr($num_obj->id, -3)+(1)),-3);
                    if($numbers[$next] != $next) {
                        $inrange=false;
                    } else
                        $provdata[$next] = $numbers[$next];
                }
                if($inrange)
                    $data->data = $provdata;
            } else {
                $data->data[$num_obj->id] = $num_obj;
            }
        }
    }
    if(!$data) $data = error_numbers($request);
    return($data);
}

function number_sort_function($a, $b)
{
    return $a->id > $b->id;
}

/**
 * kazoo buy functions
 */

function buy_numbers($request)
{
    global $sdk;

    return false;
}

/**
 * kazoo error functions
 */

function error_numbers($request)
{

    return(json_decode(
    '{
        "status": "error",
        "message": "Not Found",
        "error": 404,
        "data": {}
        }'));
}

function check_auth($headers)
{
    $auth = get_entry('token_auth', rawurlencode($headers['X-Auth-Token']));
//print_r($auth['res']->_id);

    if($headers['X-Kazoo-Cluster-ID'] && $headers['X-Auth-Token'] == $auth['res']->_id) return true;
    else return false;
}

?>