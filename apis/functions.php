<?php
//error_reporting(1);

class Object {
    function ResetObject() {
        foreach ($this as $key => $property) {
            unset($this->$key);
        }
    }
}

function show_debug($msg) {
    echo $msg."\n";
}

function get_all_dbs($host) {

    global $sag;
    $ret['err'] = false;

    try {
            $ret['res'] = $sag->getAllDatabases()->body;
        }
        catch(Exception $e) {
              $ret['err'] = $e->getMessage()."Host:".$host;
        }
    return $ret;
}

function get_entry($db, $view) {

    global $sag;
    $ret['err'] = false;

    try {
            $sag->setDatabase($db);
        }
        catch(Exception $e) {
              $ret['err'] = $e->getMessage()."DB:$db";
        }
    try {
            $ret['res'] = $sag->get($view)->body;
        }
        catch(Exception $e) {
              $ret['err'] = $e->getMessage();
        }
    return $ret;
}

// res object
function put_changed($value) {

    global $sag;
    $ret['err'] = false;
    $ret = get_entry($value->db, urlencode($value->id));
    if($ret['err']) {show_debug("Change Get:".$value->id ." Error:".$ret['err']); return(false);} else $res = $ret['res'];
    $res->regextern->pvt_changed = ((date("U", strtotime("0000-01-01"))-time())*-1); // this is gregoriantime (1.1.1 00:00)
    $res->views++;

    try {
            $sag->setDatabase($res->pvt_db_name);
            $ret['res'] = $sag->put(rawurlencode($res->_id), $res)->body->ok;
        }
        catch(Exception $e) {
              $ret['err'] = $e->getMessage()."DB:$db";
        }
    return $ret;
}

function check_couchdb($testhost, $debug=true) {

    global $dbport;
    $host = false;
    if($testhost) {
        if(file_exists("/usr/sbin/fping")) $cmd = "/usr/sbin/fping";
        if(file_exists("/usr/bin/fping")) $cmd = "/usr/bin/fping";
        if(!$cmd) { show_debug("FAILED fping not found:",'', __FILE__ ,__FUNCTION__, __LINE__); return(false);}
        $fping = exec("$cmd $testhost -t 50");
        if($fping == $testhost.' is alive') {
            $ret = json_decode(check_http('http://'.$testhost.":".$dbport, 2),TRUE);
            if($debug)show_debug("Check couchdb:".$testhost.":".$dbport."/",'d', __FILE__ ,__FUNCTION__, __LINE__);
            if($ret['couchdb'] == 'Welcome' && $ret['version'] == '1.1.1') return($testhost);
            else show_debug("FAILED couchdb:".$testhost,'', __FILE__ ,__FUNCTION__, __LINE__);
        } else show_debug("FAILED fping -t 50 ip=".$testhost,'', __FILE__ ,__FUNCTION__, __LINE__);
    }
return(false);
}

function check_http($url, $timeout) {

    $ch=curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);

    $result=curl_exec($ch);
    curl_close($ch);

return($result);

}

function get_dbhost($hosts, $debug=true)
{
    global $testsleep, $host;

    while($host == false) {
        foreach(explode(" ",$hosts) AS $testhost) { $host = check_couchdb($testhost, $debug); if($host) break;}
        if($host) continue;
        if($debug) show_debug("No connect to cluster-db sleep now for next tray in (s):".$testsleep);
        sleep($testsleep);
    }
return($host);

}

/* f_path = array(2=>ui, 3=>snom, 4=>3xx, 5=>300)
    retype = object or ''
*/

function get_groundsettings($f_path, $retype=false)
{

    switch($f_path[2])
    {
        case 'ui':
            $res = get_entry('brand_provisioner' , rawurlencode(implode($f_path,"/")));
            $c_keys = $res['res']->usr_keys->setable_phone_keys + $res['res']->usr_keys->setable_module_keys;
            switch($retype) {
                case '':
                    echo '{"success": true,"data": {"template": {"feature_keys": {"iterate": "'. $c_keys .'"}, "lines": { "iterate": 0, "text": "Lines" } } } }';
                break;
                case 'object':
                    return($res['res']);
                break;
            }
        break;
        case 'phones':
            $res = get_entry('brand_provisioner' , '/_design/provisioner/_view/listings_tree');
            echo json_encode(($res['res']->rows['0']->value));
        break;
    }
}

/* backup all_dbs */
function backup_all_dbs($dir) {

    global $host;

    $dbs = get_all_dbs($host);
    foreach($dbs['res'] AS $k => $db_a)
    {
        echo backup($db_a, $dir.'/'.rawurlencode($db_a).'/');
    }

}

/* do db->file (db=system_config, dir=./DB_BACKUP/) */
function backup($db_a, $dir, $match=false)
{
    global $host, $port;
    // get_all_docs
    $dbs = get_entry($db_a , '/_all_docs');
    $dbs = json_decode(json_encode($dbs['res']->rows), true);
    @mkdir($dir, 0777, true);

    foreach($dbs AS $k => $db){
        /* backup only if match */
        if($match == true && $match != $db['id']) continue;
        $data = get_entry($db_a , "/".rawurlencode($db['id']));
        unset($data['res']->_rev);
        @mkdir($dir.rawurlencode(urldecode($db['id'])), 0777, true);
        if(file_put_contents($dir.rawurlencode(rawurldecode($db['id'])).'/'.rawurlencode(rawurldecode($db['id'])).'.json',json_encode($data['res']))) echo $dir.rawurlencode(urldecode($db['id']))."\n ";
        if($data['res']->_attachments) {
            foreach($data['res']->_attachments AS $attachment_id => $content)
            {
                $tempUrl = "http://{$host}:{$port}/{$db_a}/" . rawurlencode($db['id']) . "/" . $attachment_id;
                //create folder
                if (!file_exists($dir . $db['id']))
                    mkdir($dir . $db['id'], 0777, true);
                $ch = getCommonCurl($tempUrl);
                $fp = fopen($dir . rawurlencode(rawurldecode($db['id'])) . '/' . $attachment_id, 'wb'); //download attachment to current folder
                echo $dir . rawurlencode(rawurldecode($db['id'])) . '/' . $attachment_id."\n";
                curl_setopt($ch, CURLOPT_FILE, $fp);
                curl_setopt($ch, CURLOPT_HEADER, 0);
                curl_setopt($ch, CURLOPT_BINARYTRANSFER, 1);
                curl_exec($ch);
                curl_close($ch);
                fclose($fp);
            }
        }
    }
    return("backup db->file finished\n");
}

/* restore all_dbs */
function restore_all_dbs($dir, $type=false) {

    if ($handle = opendir($dir)) {
        while (false !== ($entry = readdir($handle))) {
            if(".." == $entry||"." == $entry) continue;
            restore($entry, $dir.$entry);
        }
    } else echo "Error: $dir not found!\n";
}

/* do file->db (db=system_config, dir=./DB_BACKUP/) type=update or restore[none]*/
function restore($db_a, $dir, $type=false)
{
    global $sag;
    if ($handle = opendir($dir)) {
        try {$sag->createDatabase($db_a);} catch(Exception $e) {echo $e->getMessage()."DB:".$db_a."\n";}
        $sag->setDatabase($db_a);
        while (false !== ($entry = readdir($handle))) {
            if(".." == $entry||"." == $entry) continue;
            $obj1 = get_entry($db_a , "/".rawurlencode($entry));
            if($obj1) $temp_rev = $obj1['res']->_rev;
            $obj2 = json_decode(file_get_contents($dir.$entry.'/'.$entry.'.json'));
            if(is_object($obj1)) $obj = update_together($obj1['res'], $obj2, 'object');
            else $obj = $obj2;
            $obj = object2array($obj); unset($obj['err']); unset($obj['_rev']);
            if($obj['_id']) $obj['_id'] = rawurlencode($obj['_id']);
            if($obj['_attachments']) {
            unset($obj['_attachments']);
            }
            try {
print_r(rawurldecode($entry));
sleep(2);
                if(preg_match("/^\_/",$entry)) echo $sag->put(rawurldecode($entry), $obj)->body->ok;

                else echo $sag->put(rawurlencode($entry), $obj)->body->ok;
            }
            catch(Exception $e) {
                if($type == 'update' && $temp_rev) {
                    $obj['_rev'] = $temp_rev;
                    $obj['views'] = $obj['views']+1;
                }
                try {
                    if(preg_match("/^\_/",$entry)) echo $sag->put(rawurldecode($entry), $obj)->body->ok;
                    else echo $sag->put(rawurlencode($entry), $obj)->body->ok;
                }
                catch(Exception $e) {
                    echo $e->getMessage()."DB:".$db_a." file:".$entry."\n";
                }
            }
            unset($obj);
            $obj = get_entry($db_a , "/".rawurlencode($entry));
            if ($attdir = opendir($dir.$entry.'/')) {
                while (false !== ($att = readdir($attdir))) {
                    if(".." == $att||"." == $att||$entry.".json" == $att) continue;
                    echo attach_upload(rawurlencode($entry) .'/', $obj['res']->_rev, $dir ,  $id, $att['content_type']);
                }
            }
        unset($obj);unset($obj1);unset($obj2);
        }
    }
    return("restore file->db finished\n");
}

function getCommonCurl($url)
{
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_NOBODY, false);
    curl_setopt($curl, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_TIMEOUT, 60);
    curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 curl');
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($curl, CURLOPT_MAXREDIRS, 3);
    curl_setopt($curl, CURLOPT_URL, $url);
    return $curl;
}

/* upload attachments */
function attach_upload($webpath, $rev=false, $dir, $filename, $content_type) {

echo "$rev, $dir, $filename, $content_type";
    global $host, $dbport;

    $process = false;
    $url = "http://$host:$dbport";
    $ch = curl_init();
    $data = file_get_contents($dir."/".$filename);
    $options = array(
    CURLOPT_URL => $url.'/'. basename($filename). '?rev='.$rev,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER => array ("Content-Length: ".strlen($data),"Content-Type: ".$content_type),
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $data);
    curl_setopt_array($ch, $options);
    $process = curl_exec($ch);
    curl_close($ch);
    return $process;
}

/* first object is base, object after is overlayed */
function update_together($object1, $object2, $typ)
{
    switch($typ) {
        case 'json':
            $res = json_encode(array_replace_recursive(json_decode( $object1, true ) , json_decode( $object2, true )));
        break;
        case 'object':
            $res = array_replace_recursive(object2array($object1) , object2array($object2) );
        break;
    }
    return($res);
}

/* first object is base, object after is overlayed add */
function merge_together($object1, $object2, $typ)
{
    switch($typ) {
        case 'json':
            $res = json_encode(array_merge_recursive(json_decode( $object1, true ) , json_decode( $object2, true )));
        break;
        case 'object':
            $res = array_merge_recursive($object1 , $object2);
        break;
    }
    return($res);
}

function array2object($array) {

    if (is_array($array)) {
        $obj = new StdClass();
        foreach ($array as $key => $val){
            $obj->$key = $val;
        }
    }
    else { $obj = $array; }
    return $obj;
}

function object2array($object) {
    if (is_object($object)) {
        foreach ($object as $key => $value) {
            $array[$key] = $value;
        }
    }
    else {
        $array = $object;
    }
    return $array;
}

?>