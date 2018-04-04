<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Location Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/locations', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues", $queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		$queryData = getInsertQueryData($request);
		$queryString = DBUtil::buildInsertQuery('locations', $queryData['insertValues']);
		array_push($results, DBUtil::runCommand($queryString));
	}
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Read //
$app->get('/locations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('locations', $queryData['fields'], $queryData['where']);
	$locations = DBUtil::runQuery($queryString);
	$response->getBody()->write($locations);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/locations', function (Request $request, Response $response, array $args) {
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
	
		$queryString = DBUtil::buildUpdateQuery('locations', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Delete //
$app->delete('/locations', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteLocationsQuery = DBUtil::buildDeleteQuery('locations', $queryData['where']);
	$results = DBUtil::runCommand($deleteLocationsQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);