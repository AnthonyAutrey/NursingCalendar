<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// UserGroup Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/recurringeventrelations', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['insertValues']) || 
		!isset($queryData['insertValues']['RecurringID']) ||
		!isset($queryData['insertValues']['EventID']) ||
		!isset($queryData['insertValues']['LocationName']) ||
		!isset($queryData['insertValues']['RoomName'])) {
			return $response->withStatus(400);
		}
		
		$queryString = DBUtil::buildInsertQuery('RecurringEventRelation', $queryData['insertValues']);
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireInstructorOrAdmin);

// Read //
$app->get('/recurringeventrelations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('recurringeventrelation', $queryData['fields'],  $queryData['where']);
	$relations = DBUtil::runQuery($queryString);
	$response->getBody()->write($relations);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireInstructorOrAdmin);

// Delete //
$app->delete('/recurringeventrelations', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteUserGroupsQuery = DBUtil::buildDeleteQuery('recurringeventrelation', $queryData['where']);
	$results = DBUtil::runCommand($deleteUserGroupsQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireInstructorOrAdmin);