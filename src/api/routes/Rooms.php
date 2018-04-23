<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Room Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/rooms', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues", $queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		if (!isset($queryData['insertValues']) || 
		!isset($queryData['insertValues']['RoomName']) ||
		!isset($queryData['insertValues']['LocationName'])) {
			return $response->withStatus(400);
		}

		$queryString = DBUtil::buildInsertQuery('rooms', $queryData['insertValues']);
		$results[$queryData['insertValues']] = DBUtil::runCommand($queryString);
	}
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Read //
$app->get('/rooms', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('rooms natural left outer join roomResourceRelation', $queryData['fields'], $queryData['where']);
	$rooms = DBUtil::runQuery($queryString);
	$response->getBody()->write($rooms);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/rooms', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getUpdateQueryData($request);

	if (array_key_exists("setValues",$queryDataArray) && array_key_exists("where",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['setValues']) ||
			!count($queryData['setValues']) > 0 ||
			!isset($queryData['where'])
			) {
			return $response->withStatus(400);
		}
	
		$queryString = DBUtil::buildUpdateQuery('rooms', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Delete //
$app->delete('/rooms', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getDeleteQueryData($request);
	if (array_key_exists("where", $queryDataArray))
		$queryDataArray = [$queryDataArray];
	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['where'])) {
			return $response->withStatus(400);
		}
		$deleteQuery = DBUtil::buildDeleteQuery('rooms', $queryData['where']);
		array_push($results, DBUtil::runCommand($deleteQuery));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAnyRole);


// Room Resource Relation /////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/roomresources', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues", $queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		if (!isset($queryData['insertValues']) || 
		!isset($queryData['insertValues']['RoomName']) ||
		!isset($queryData['insertValues']['ResourceName']) ||
		!isset($queryData['insertValues']['LocationName'])) {
			return $response->withStatus(400);
		}

		$queryString = DBUtil::buildInsertQuery('RoomResourceRelation', $queryData['insertValues']);
		$results[$queryData['insertValues']] = DBUtil::runCommand($queryString);
	}
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Read //
$app->get('/roomresources', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('RoomResourceRelation', $queryData['fields'], $queryData['where']);
	$roomResources = DBUtil::runQuery($queryString);
	$response->getBody()->write($roomResources);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/roomresources', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getUpdateQueryData($request);

	if (array_key_exists("setValues",$queryDataArray) && array_key_exists("where",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['setValues']) ||
			!count($queryData['setValues']) > 0 ||
			!isset($queryData['where'])
			) {
			return $response->withStatus(400);
		}
	
		$queryString = DBUtil::buildUpdateQuery('RoomResourceRelation', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Delete //
$app->delete('/roomresources', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getDeleteQueryData($request);
	if (array_key_exists("where", $queryDataArray))
		$queryDataArray = [$queryDataArray];
	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['where'])) {
			return $response->withStatus(400);
		}
		$deleteQuery = DBUtil::buildDeleteQuery('RoomResourceRelation', $queryData['where']);
		array_push($results, DBUtil::runCommand($deleteQuery));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);