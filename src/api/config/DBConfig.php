<?php

class DBConfig {

	private static $dbHost = 'localhost';
	private static $dbUsername = 'root';
	private static $dbName = 'nursing_calendar';

	private static $connection;

	private static function connect() {
		$dbPassword = getenv("NURSECAL_DB_PASS");
		
		$connectionString = "mysql:host=". DBConfig::$dbHost.";dbname=".DBConfig::$dbName.";";
		$dbConnection = new PDO($connectionString, DBConfig::$dbUsername, $dbPassword);
		$dbConnection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$dbConnection->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);

		return $dbConnection;	
	}

	public static function getConnection() {
		if (!isset(DBConfig::$connection)) {
			DBConfig::$connection = DBConfig::connect();
		}
		
		return DBConfig::$connection;
	}
}
