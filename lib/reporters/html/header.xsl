	<head>
		<meta charset='UTF-8' /> 
		<meta name='description' content='ExtentReports (by Anshoo Arora) is a reporting library for automation testing for .NET and Java. It creates detailed and beautiful HTML reports for modern browsers. ExtentReports shows test and step summary along with dashboards, system and environment details for quick analysis of your tests.' />
		<meta name='robots' content='noodp, noydir' />
		<meta name='viewport' content='width=device-width, initial-scale=1' />
		<meta name='extentx' id='extentx' />
		<title>Oxygen Test Results</title>
		<!-- Latest compiled and minified CSS -->
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous"/>
		<!-- Optional theme -->
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous"/>
		<!-- jQuery library -->
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.0/jquery.min.js"></script>
		<!-- Latest compiled and minified JavaScript -->
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
		<style>
			.summary .counter {
				margin-top: 20px;
			}
			.summary .counter:before {
				content: "";
				position: absolute;
				left: 0;
				height: 55px;
				border-left: 2px solid #ADB2B5;
			}
			.summary .counter .value {
				font-size: 1.8em;
			}
			.expand-buttons .btn.collapsed {
				
			}
			.bs-callout {
				padding: 20px;
				margin: 20px 0;
				border: 1px solid #eee;
				border-left-width: 5px;
				border-radius: 3px;
			}
			.bs-callout h4 {
				margin-top: 0;
				margin-bottom: 5px;
			}
			.bs-callout p:last-child {
				margin-bottom: 0;
			}
			.bs-callout code {
				border-radius: 3px;
			}
			.bs-callout+.bs-callout {
				margin-top: -5px;
			}
			.bs-callout-default {
				border-left-color: #777;
			}
			.bs-callout-default h4 {
				color: #777;
			}
			.bs-callout-primary {
				border-left-color: #428bca;
			}
			.bs-callout-primary h4 {
				color: #428bca;
			}
			.bs-callout-success {
				border-left-color: #5cb85c;
			}
			.bs-callout-success h4 {
				color: #5cb85c;
			}
			.bs-callout-danger {
				border-left-color: #d9534f;
			}
			.bs-callout-danger h4 {
				color: #d9534f;
			}
			.bs-callout-warning {
				border-left-color: #f0ad4e;
			}
			.bs-callout-warning h4 {
				color: #f0ad4e;
			}
			.bs-callout-info {
				border-left-color: #5bc0de;
			}
			.bs-callout-info h4 {
				color: #5bc0de;
			}
			h2 > span.label-sm {
				font-size: 12px;
				margin-left: 10px;
				margin-top: 10px;
				position: absolute;
			}
			h3.panel-title {
				font-size: 20px;
			}
			h3.panel-title .label {
				font-size: 60%;
				margin-left: 10px;
				position: relative;
				top: -4px;
			}
			.panel-heading .accordion-toggle:before {
				/* symbol for "opening" panels */
				font-family: 'Glyphicons Halflings';  /* essential for enabling glyphicon */
				content: "\e114";    /* adjust as needed, taken from bootstrap.css */
				float: left;        /* adjust as needed */
				color: grey;         /* adjust as needed */
				padding-right: 10px;
			}
			.panel-heading .accordion-toggle.collapsed:before {
				/* symbol for "collapsed" panels */
				content: "\e080";    /* adjust as needed, taken from bootstrap.css */
			}
		</style>
		<!-- .summary > .counter:nth-of-type(1):before {
				border-left: none;
			}
			-->
	</head>
