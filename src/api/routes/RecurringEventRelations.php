<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// UserGroup Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/recurringeventrelations', function (Request $request, Response $response, array $args) use ($db) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];
	$queries = [""];	

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

		if (strlen($queries[count($queries) - 1]) > 100)
			array_push($queries, "");

		$queries[count($queries) - 1] .= DBUtil::buildInsertQuery('RecurringEventRelation', $queryData['insertValues']) . ';';
	}

	foreach ($queries as $query) {
		if ($query !== "")
			array_push($results, DBUtil::runCommandWithDB($db, $query));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireInstructorOrAdmin);

// Read //
$app->get('/recurringeventrelations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('RecurringEventRelation', $queryData['fields'],  $queryData['where']);
	$relations = DBUtil::runQuery($queryString);
	$response->getBody()->write($relations);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Delete //
$app->delete('/recurringeventrelations', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getDeleteQueryData($request);

	if (array_key_exists("where", $queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['where'])) {
			return $response->withStatus(400);
		}

		$deleteQuery = DBUtil::buildDeleteQuery('RecurringEventRelation', $queryData['where']);
		array_push($results, DBUtil::runCommand($deleteQuery));
	}
	
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

})->add($requireInstructorOrAdmin);