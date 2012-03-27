teExt: T&E Extension
====================

T&E Assistant is part of and also extension to the Timmo project, which is dedicated to design and develop an iPhone client for T&E app.

* As part of the Timmo project, teExt is focused on provide the REST/JSON style API for Timmo iPhone client.

* As extension to the Timmo project, teExt provided several chrome embedded and cli style client for different user scenarios.


Extension
---------
Extension is a chrome extension, which have 2 different responsibilities in 2 different user scenarios:

* On end-user side, it works as a local T&E assistant to help QA and other roles to track their daily work, then generate and fill timesheet.
  This function is useful for QAs and BAs and anyone whose work cannot tracked by other approaches.
  The T&E assistant function is enabled by default and cannot be disabled.

* On server side, it works as a worker daemon for scheduler server, which fill the timesheet when assignment from scheduler server arrived.
  The worker daemon function is disabled by default, and can be enabled by invoking "tracker.setup(<scheduler server address>);" at the console of background.html. The call will wake up the save the configuration and wake up the tracker.
	* To disable and re-enable the tracker temporarily, you can invoke "tracker.stop()" and "tracker.start()" in console of background.html
	* To relocate the scheduler server, you can invoke "tracker.setup(<new server address>)", and the new config will be saved and the tracker will be restarted to listen to new server.
	* To disable the worker daemon function, you can invoke "tracker.setup()", without any parameter. Then the tracker will be disabled permanently.


Server
------
Server is a scheduler server based on node.js, which is required by Timmo iPhone client and teExt powershell client.


Powershell
----------
List-Commit.ps1 is a powershell script that can extract hg commit logs and generate timesheet data according to the logs, which is really useful for devs.