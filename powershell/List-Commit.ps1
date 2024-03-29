param(
	 [int]$week = 0,
	 [string]$server = $null,
	 [string[]]$user = @(),
	 [switch]$post  
   )
if([string]::IsNullOrEmpty($server)) {
	$server = "http://192.168.1.5:3000/Send"
}
else {
    $server = "http://{0}/Send" -f $server
	$post = $true;
}
   
function Extract-LogItems() {
    $items = @()
    $item = @{}
    
    foreach ($line in $input)
    {
       if($line -eq $Null)
       {
           continue;
       }
       $line = $line.Trim();
       if($line -eq "")
       {
           $items += $item 
           $item = @{};
           continue;
       }
       $parts = $line.Split(':',2);
       $key = $parts[0].Trim();
       $value = $parts[1].Trim();
       
       $item[$key]=$value
    }

    [array]::Reverse($items)
    $items
}

$dayNames = @{
	"Mon"=0;
	"Tue"=1;
	"Wed"=2;
	"Thu"=3;
	"Fri"=4;
	"Sat"=5;
	"Sun"=6;
}
function CreateItem {
	$item = @{}
	$item["stories"] = @()
	$item['hours'] = $(0,0,0,0,0,0,0)
	$item
}

function ComposeTimesheetHours {
	$items = @()
	$index=0
	$timesheetItem = CreateItem
	foreach($item in $input) {
		if($item["summary"] -match "(#\d\d\d\d)\s") {
			$flag = $false
			while($index -lt $dayNames[$item["date"].SubString(0,3)]) {
				$timesheetItem["hours"][$index] = 8
				$index++;
				$flag = $true
			}
			if($flag) {
				$items += $timesheetItem
				$timesheetItem = CreateItem
			}
			#$matches | % { $timesheetItem["stories"] += $_}
			if($index -eq $dayNames[$item["date"].SubString(0,3)]) {
				$timesheetItem["stories"] += $matches[1]
				$timesheetItem["hours"][$index] = 8
			} 
		}
	}
	$items += $timesheetItem
	$items | %{ $_["description"] = [string]::Join(" ",$_["stories"])} 
	$items | %{ $_["hoursText"] = [string]::Join(",", $_["hours"])}
	$items 
}

function BuildJsonItems() {
	$content = $input | %{
		'{{"code":"{0}","billable":true,"description":"{1}","hours":[{2}]}}' -f $code, $_.description, $_.hoursText
	}
	[string]::Join(",", $content)
}

function format-object() {
	foreach($obj in $input) {
		$newObj = New-Object object
		foreach($key in $obj.Keys) {
			$newObj | Add-Member NoteProperty $key $obj[$key]
		}
		
		$newObj
	} 
}

function BuildJson() {
	$result = New-Object System.Text.StringBuilder
	[void]$result.Append("{")
	[void]$result.AppendFormat('"username":"{0}",', $user[0])
	[void]$result.Append('"timesheets":[{')
	[void]$result.AppendFormat('"dueDate":"{0}",', $endDay.ToString("yyyy-MM-dd"))
	[void]$result.Append('"hasExpense":false,')
	[void]$result.Append('"items":[')
	[void]$result.Append($($input | BuildJsonItems($code)))
	[void]$result.Append(']')
	[void]$result.Append("}]")
	[void]$result.Append("}")

	$result.ToString()
}

function PostJson($json) {
	$req = [System.Net.WebRequest]::Create($server)
	$req.Method = "POST"
	$req.ContentType = "application/json"
	$writer = New-Object System.IO.StreamWriter -a $($req.GetRequestStream())
	$writer.Write($json)
	$writer.Close()
	
	$req.GetResponse()
}

$day = [DateTime]::Today.AddDays(-3 + $week * 7)
$day = $day.AddDays(-$day.DayOfWeek + 1)
$endDay = $day.AddDays(6)

$logItems = iex $('hg log -d "{0} to {1}" {2}' -f  $day.ToString("yyyy-MM-dd"), $endDay.ToString("yyyy-MM-dd"), $($user | %{ "-u " + $_ })) | Extract-LogItems

if($logItems -eq $null) {
	Write-Host "No Log Item Found"
	exit
}

Write-Host Hg Log From $day.ToShortDateString() to $endDay.ToShortDateString()
$logItems | Format-object | %{$_.date = $_.date.SubString(0,3); $_} | Format-Table -p date,user,summary -a | Out-Host

if($post) {
	$code = "PWC0001 ASSIG_3 MISC"
	$json = $logItems | ComposeTimesheetHours | format-object | BuildJson

	PostJson($json)
}
