<?php return array (
  0 => 
  array (
    'POST' => 
    array (
      '/login' => 'route0',
      '/events' => 'route6',
      '/rooms' => 'route10',
      '/roomresources' => 'route14',
      '/locations' => 'route18',
      '/resources' => 'route22',
      '/users' => 'route25',
      '/groups' => 'route35',
      '/notifications' => 'route42',
      '/overriderequests' => 'route47',
    ),
    'GET' => 
    array (
      '/logout' => 'route1',
      '/session' => 'route2',
      '/events' => 'route4',
      '/eventswithrelations' => 'route5',
      '/rooms' => 'route9',
      '/roomresources' => 'route13',
      '/locations' => 'route17',
      '/resources' => 'route21',
      '/users' => 'route24',
      '/groups' => 'route33',
      '/semestergroups' => 'route34',
      '/logs' => 'route38',
      '/overriderequests' => 'route46',
      '/publishdates' => 'route49',
      '/recurringeventrelations' => 'route52',
    ),
    'PUT' => 
    array (
      '/events' => 'route3',
      '/rooms' => 'route8',
      '/roomresources' => 'route12',
      '/locations' => 'route16',
      '/resources' => 'route20',
      '/usergroups' => 'route26',
      '/preferences' => 'route29',
      '/groups' => 'route32',
      '/logs' => 'route37',
      '/notifications' => 'route40',
      '/overriderequests' => 'route44',
      '/publishdates' => 'route50',
      '/recurringeventrelations' => 'route51',
    ),
    'DELETE' => 
    array (
      '/events' => 'route7',
      '/rooms' => 'route11',
      '/roomresources' => 'route15',
      '/locations' => 'route19',
      '/resources' => 'route23',
      '/usergroups' => 'route28',
      '/groups' => 'route36',
      '/logs' => 'route39',
      '/recurringeventrelations' => 'route53',
    ),
  ),
  1 => 
  array (
    'GET' => 
    array (
      0 => 
      array (
        'regex' => '~^(?|/usergroups/([^/]+)|/preferences/([^/]+)()|/notifications/([^/]+)()()|/overriderequests/([^/]+)()()())$~',
        'routeMap' => 
        array (
          2 => 
          array (
            0 => 'route27',
            1 => 
            array (
              'cwid' => 'cwid',
            ),
          ),
          3 => 
          array (
            0 => 'route30',
            1 => 
            array (
              'CWID' => 'CWID',
            ),
          ),
          4 => 
          array (
            0 => 'route41',
            1 => 
            array (
              'cwid' => 'cwid',
            ),
          ),
          5 => 
          array (
            0 => 'route45',
            1 => 
            array (
              'id' => 'id',
            ),
          ),
        ),
      ),
    ),
    'POST' => 
    array (
      0 => 
      array (
        'regex' => '~^(?|/preferences/([^/]+))$~',
        'routeMap' => 
        array (
          2 => 
          array (
            0 => 'route31',
            1 => 
            array (
              'CWID' => 'CWID',
            ),
          ),
        ),
      ),
    ),
    'DELETE' => 
    array (
      0 => 
      array (
        'regex' => '~^(?|/notifications/([^/]+)|/overriderequests/([^/]+)/([^/]+)/([^/]+))$~',
        'routeMap' => 
        array (
          2 => 
          array (
            0 => 'route43',
            1 => 
            array (
              'id' => 'id',
            ),
          ),
          4 => 
          array (
            0 => 'route48',
            1 => 
            array (
              'id' => 'id',
              'location' => 'location',
              'room' => 'room',
            ),
          ),
        ),
      ),
    ),
  ),
);