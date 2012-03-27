(function(){
var $__ = $;

var fileref=document.createElement('script')
fileref.setAttribute("type","text/javascript")
fileref.setAttribute("src", 'http://code.jquery.com/jquery-1.7.1.min.js')
document.getElementsByTagName("head")[0].appendChild(fileref)

var $jq = $.noConflict(true);
$=$__;

$jq('#week_ending_date_string').val('18 March 2012');

var row,tds;
for(var fo = 0;fo<5; fo ++) {
  row = $jq( "#time_record_"+fo+"_row");
  tds = row.find('td');
  $jq('input',tds[2]).val('PWC0001 ASSIG_3 MISC');
  $jq('input[type=radio]:first',tds[4]).attr('checked','checked');
  
  $jq('input',tds[5]).val('#sotry');
  $jq('input',tds[6+fo]).val('8');
}

$jq('#time_sheet_expenses_false').attr('checked','checked')
$('input[type=submit]:first').click();
})();