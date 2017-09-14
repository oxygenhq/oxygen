<?xml version="1.0"?>
<xsl:transform xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ms='urn:schemas-microsoft-com:xslt' version="1.0">
	<xsl:output method="html"/>
	<xsl:variable name="smallcase" select="'abcdefghijklmnopqrstuvwxyz'" />
	<xsl:variable name="uppercase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />
	<xsl:template match="/">
		<html>
			<!--<xsl:call-template name="head"/>-->
			<xsl:copy-of select="document('header.xsl')"  />
			<body>
				<div class="container" role="main">
					<xsl:apply-templates select="test-results" />
				</div>
			</body>
		</html>
	</xsl:template>
	
	<xsl:template match="test-results">
		<div class="row">
			<div class="col-md-12 summary">
				<h1 class="page-header">Tests Summary</h1>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Status</span>
					<div class="value">
						<xsl:value-of select="translate(./summary/@status, $smallcase, $uppercase)"/>
						<xsl:choose>
							<xsl:when test="./test-result/summary/@status='failed'">
								FAILED
							</xsl:when>
							<xsl:otherwise>
								PASSED
							</xsl:otherwise>
						</xsl:choose>
					</div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Start Date</span>
					<div class="value"><xsl:value-of select="ms:format-date(./test-result[1]/summary/@startTime, 'MMM dd')"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Start / End Time</span>
					<div class="value">
						<xsl:value-of select="ms:format-time(./test-result[1]/summary/@startTime, 'HH:mm')"/>
						-
						<xsl:value-of select="ms:format-time(./test-result[last()]/summary/@endTime, 'HH:mm')"/>
					</div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Total Duration</span>
					<div class="value"><xsl:value-of select="sum(./test-result/summary/@duration)"/> sec</div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Total Tests</span>
					<div class="value"><xsl:value-of select="count(./test-result)"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Passed Tests</span>
					<div class="value passed"><xsl:value-of select="count(./test-result/summary[@status='passed'])"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Failed Tests</span>
					<div class="value failed"><xsl:value-of select="count(./test-result/summary[@status='failed'])"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Iterations</span>
					<div class="value"><xsl:value-of select="count(./test-result[1]/iterations)"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Total Steps</span>
					<div class="value"><xsl:value-of select="count(./test-result//steps)"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Passed Steps</span>
					<div class="value passed"><xsl:value-of select="count(./test-result//steps[@status='passed'])"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Failed Steps</span>
					<div class="value failed"><xsl:value-of select="count(./test-result//steps[@status='failed'])"/></div>
				</div>
				<div class="col-md-3 col-sm-3 col-xs-6 counter">
					<span>Warning Steps</span>
					<div class="value warning"><xsl:value-of select="count(./test-result//steps[@status='warning'])"/></div>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-12 summary">
				<h1 class="page-header">Tests / Devices / Browsers</h1>
				<table class="table table-bordered">
					<thead>
						<tr>
							<th>Test Name</th>
							<th>Device / Browser</th>
							<th>Platform</th>
							<th>Pass/Failed Cases</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>					
					<xsl:for-each select="./test-result">
						<tr>
							<td><xsl:value-of select="./summary/@name"/></td>
							<td>
								<xsl:choose>
									<xsl:when test="./capabilities/deviceName">
										<xsl:value-of select="./capabilities/deviceName/."/>
										<xsl:if test="./capabilities/browserName"> / <xsl:value-of select="./capabilities/browserName/."/></xsl:if>
									</xsl:when>
									<xsl:when test="./options/deviceName">
										<xsl:value-of select="./options/deviceName/."/>
										<xsl:if test="./options/browserName"> / <xsl:value-of select="./capabilities/browserName/."/></xsl:if>
									</xsl:when>
									<xsl:otherwise>
										<xsl:value-of select="./options/browserName/."/>
									</xsl:otherwise>
								</xsl:choose>
							</td>
							<td>
								<xsl:choose>
									<xsl:when test="./capabilities/platformName">
										<xsl:value-of select="./capabilities/platformName/."/>&#160;
										<xsl:value-of select="./capabilities/platformVersion/."/>
									</xsl:when>
									<xsl:when test="./options/platformName">
										<xsl:value-of select="./options/platformName/."/>&#160;
										<xsl:value-of select="./options/platformVersion/."/>
									</xsl:when>
								</xsl:choose>
							</td>
							<td>
								<xsl:variable name="casesTotal" select="count(./iterations/testcases)"/>
								<xsl:variable name="casesFailed" select="count(./iterations/testcases[./iterations[@status='failed']])"/>
								<xsl:variable name="casesFailedRatio" select="$casesFailed div $casesTotal"/>
								<xsl:variable name="casesPassed" select="$casesTotal - count(./iterations/testcases[./iterations[@status='failed']])"/>
								<xsl:variable name="casesPassedRatio" select="$casesPassed div $casesTotal"/>
								<div class="progress">
								  <div class="progress-bar progress-bar-success">
									<xsl:attribute name="style">
									   <xsl:value-of select="'width: '"/>
									   <xsl:value-of select="format-number($casesPassedRatio, '#,##0%')"/>
									</xsl:attribute>
									<span><xsl:value-of select="format-number($casesPassedRatio, '#,##0%')"/> (<xsl:value-of select="$casesPassed"/>)</span>
								  </div>
								  <!--<div class="progress-bar progress-bar-warning" style="width: 5%">
									<span class="sr-only">20% Complete (warning)</span>
								  </div>-->
								  <div class="progress-bar progress-bar-danger">
									<xsl:attribute name="style">
									   <xsl:value-of select="'width: '"/>
									   <xsl:value-of select="format-number($casesFailedRatio, '#,##0%')"/>
									</xsl:attribute>
									<span><xsl:value-of select="format-number($casesFailedRatio, '#,##0%')"/> (<xsl:value-of select="$casesFailed"/>)</span>
								  </div>
								</div>
							</td>
							<td>
								<xsl:choose>
									<xsl:when test="./summary/@status = 'failed'">
										<span class="label label-danger label-sm">
											FAILED
										</span>
									</xsl:when>
									<xsl:otherwise>
										<span class="label label-success label-sm">
											PASSED
										</span>
									</xsl:otherwise>
								</xsl:choose>
							</td>
						</tr>
					</xsl:for-each>
					</tbody>
				</table>
			</div>
		</div>
		<div class="row">
			<div class="col-md-12 summary">
				<h1 class="page-header">Detailed Results</h1>
				<xsl:for-each select="./test-result">
					<h2>
						<xsl:value-of select="./summary/@name"/> /
						<xsl:choose>
							<xsl:when test="./capabilities/deviceName">
								<xsl:value-of select="./capabilities/deviceName/."/>
								<xsl:if test="./capabilities/browserName"> / <xsl:value-of select="./capabilities/browserName/."/></xsl:if>
							</xsl:when>
							<xsl:when test="./options/deviceName">
								<xsl:value-of select="./options/deviceName/."/>
								<xsl:if test="./options/browserName"> / <xsl:value-of select="./capabilities/browserName/."/></xsl:if>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="./options/browserName/."/>
							</xsl:otherwise>
						</xsl:choose>
						<xsl:choose>
							<xsl:when test="./summary/@status='failed'">
								<span class="label label-danger label-sm">
									<xsl:value-of select="translate(./summary/@status, $smallcase, $uppercase)"/>
								</span>
							</xsl:when>
							<xsl:otherwise>
								<span class="label label-success label-sm">
									<xsl:value-of select="translate(./summary/@status, $smallcase, $uppercase)"/>
								</span>
							</xsl:otherwise>
						</xsl:choose>
					</h2>
					<xsl:for-each select="./iterations">
						<xsl:apply-templates select="."/>
					</xsl:for-each>
				</xsl:for-each>
			</div>
		</div>
	</xsl:template>
		
	<xsl:template match="iterations">
		<div class="panel-group" id="accordion">
		  <div class="panel panel-default iteration">
			<div class="panel-heading">
			  <h3 class="panel-title">
				<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#collapse-it">
					<xsl:attribute name="href">#collapse-it<xsl:value-of select="@iterationNum"/></xsl:attribute>
					Iteration #<xsl:value-of select="@iterationNum"/>
				</a>
					<xsl:choose>
						<xsl:when test="@status='failed'">
							<span class="label label-danger label-sm">
								<xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
							</span>
						</xsl:when>
						<xsl:otherwise>
							<span class="label label-success label-sm">
								<xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
							</span>
						</xsl:otherwise>
					</xsl:choose>

				</h3>
			</div>
			<div id="collapse-it" class="panel-collapse collapse in">
				<xsl:attribute name="id">collapse-it<xsl:value-of select="@iterationNum"/></xsl:attribute>
				<div class="panel-body">
					<xsl:for-each select="testcases">
						<xsl:if test="not(iterations/steps/failure) and iterations/failure">
							<pre style="background-color: #fcacac">
								<b><xsl:value-of select="iterations/failure/@type"/></b><br/>
								<xsl:value-of select="iterations/failure/@message"/>
								<xsl:if test="iterations/failure/@line"> at line <xsl:value-of select="iterations/failure/@line"/></xsl:if>
							</pre>
						</xsl:if>
						<h4><xsl:value-of select="@name"/></h4>
						<table class="table table-bordered" style="width: 100%; table-layout: fixed;">
							<thead>
								<tr>
									<th style="width: 3%;">#</th>
									<th style="width: 45%;">Step</th>
									<th style="width: 15%;">Transaction</th>
									<th style="width: 7%;">Duration</th>
									<th style="width: 7.5%;">Status</th>
									<th>Failure</th>
								</tr>
							</thead>
							<tbody>					
								<xsl:for-each select="iterations/steps">
									<xsl:if test="not(contains(@name, '.transaction'))">
										<tr>
											<xsl:choose>
												<xsl:when test="contains(@name, 'log.info')">
													<td></td>
													<td style="word-wrap: break-word; width: 100%; background-color: #e9f1f9;">
												  	<xsl:variable name="cmdArg" select="substring(@name, string-length('log.info(') + 1, string-length(@name) - string-length('log.info(') - 1)"/>
													<xsl:choose>
														<xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
															<xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
														</xsl:when>
														<xsl:otherwise>
															<xsl:value-of select="$cmdArg"/>
														</xsl:otherwise>
													</xsl:choose>
													</td>
												</xsl:when>
												<xsl:when test="contains(@name, 'log.warn')">
													<td></td>
													<td style="word-wrap: break-word; width: 100%; background-color: #f9f9e9;">
														<xsl:variable name="cmdArg" select="substring(@name, string-length('log.warn(') + 1, string-length(@name) - string-length('log.warn(') - 1)"/>
														<xsl:choose>
															<xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
																<xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
															</xsl:when>
															<xsl:otherwise>
																<xsl:value-of select="$cmdArg"/>
															</xsl:otherwise>
														</xsl:choose>
													</td>
												</xsl:when>
												<xsl:when test="contains(@name, 'log.error')">
													<td></td>
													<td style="word-wrap: break-word; width: 100%; background-color: #f9e9ec;">
														<xsl:variable name="cmdArg" select="substring(@name, string-length('log.error(') + 1, string-length(@name) - string-length('log.error(') - 1)"/>
														<xsl:choose>
															<xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
																<xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
															</xsl:when>
															<xsl:otherwise>
																<xsl:value-of select="$cmdArg"/>
															</xsl:otherwise>
														</xsl:choose>
													</td>
												</xsl:when>
												<xsl:when test="contains(@name, 'log.debug')">
													<td></td>
													<td style="word-wrap: break-word; width: 100%; background-color: #e9f9ee;">
														<xsl:variable name="cmdArg" select="substring(@name, string-length('log.debug(') + 1, string-length(@name) - string-length('log.debug(') - 1)"/>
														<xsl:choose>
															<xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
																<xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
															</xsl:when>
															<xsl:otherwise>
																<xsl:value-of select="$cmdArg"/>
															</xsl:otherwise>
														</xsl:choose>
													</td>
												</xsl:when>
												<xsl:otherwise>
													<td><xsl:number count="steps[not(contains(@name, '.transaction')) and not(contains(@name, 'log.'))]" /></td>
													<td style="word-wrap: break-word; width: 100%;">
														<xsl:value-of select="@name"/>
													</td>
													<td><xsl:value-of select="@transaction"/></td>
													<td><xsl:value-of select="format-number(@duration div 1000, '###,##0.00')"/> s</td>
													<td>
														<xsl:choose>
															<xsl:when test="@status='failed'">
																<span class="label label-danger label-sm">
																	<xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
																</span>
															</xsl:when>
															<xsl:when test="@status='warning'">
																<span class="label label-warning label-sm">
																	<xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
																</span>
															</xsl:when>
															<xsl:otherwise>
																<span class="label label-success label-sm">
																	<xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
																</span>
															</xsl:otherwise>
														</xsl:choose>
													</td>
													<td>
														<xsl:if test="failure">
															<xsl:choose>
																<xsl:when test="@screenshotFile">
																	<a target="_blank"><xsl:attribute name="href">./<xsl:value-of select="@screenshotFile"/></xsl:attribute>
																		<b><xsl:value-of select="failure/@type"/></b><br/>
																		<xsl:value-of select="failure/@message"/>
																		<xsl:if test="failure/data/line">
																			at line <xsl:value-of select="failure/data/line"/>
																		</xsl:if>
																	</a>
																</xsl:when>
																<xsl:otherwise>
																	<b><xsl:value-of select="failure/@type"/></b><br/>
																	<xsl:value-of select="failure/@message"/>
																	<xsl:if test="failure/data/line">
																		at line <xsl:value-of select="failure/data/line"/>
																	</xsl:if>
																</xsl:otherwise>
															</xsl:choose>
														</xsl:if>
													</td>
												</xsl:otherwise>
											</xsl:choose>
										</tr>
									</xsl:if>
								</xsl:for-each>
								
							</tbody>
						</table>
					</xsl:for-each>
				</div>
			</div>
		  </div>
		</div>
	</xsl:template>
</xsl:transform>
