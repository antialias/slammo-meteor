var Leagues = new Meteor.Collection("leagues");
var Teams = new Meteor.Collection("teams");
var Skaters = new Meteor.Collection("skaters");
var ThingsFetchedFromRinxter = new Meteor.Collection("thingsFetchedFromRinxter");
if (Meteor.isClient) {
	Session.set("selectedLeagueId", "GGRD");
	Session.set("selectedTeamId", "7");
	Meteor.call("getSkatersForTeam", Session.get("selectedTeamId"));
	Handlebars.registerHelper('selectedTeam', function(teamId) {
	  return teamId === Session.get("selectedTeamId") ? 'selected' : '';
	});
	Template.hello.events({
		// 'change .league-select' : function (event) {
		//   Session.set("selectedLeagueId", event.currentTarget.value);
		// },
		'change #team-select' : function (event) {
			Session.set("selectedTeamId", event.currentTarget.value);
			Meteor.call("getSkatersForTeam", Session.get("selectedTeamId"));
		},
		'click #refresh-database' : function () {
		  // template data, if any, is available in 'this'
		  Meteor.call('refreshDatabase');
		},
		'click #empty-database' : function () {
		  // template data, if any, is available in 'this'
		  Meteor.call('emptyDatabase');
		},
		'click #break-me' : function () {
		  debugger;
		}
	});
	Template.hello.leagues = function () {
	  return Leagues.find();
	};
	Template.hello.teams = function () {
	  return Teams.find({league: Session.get("selectedLeagueId")});
	};
	Template.hello.currentLeagueId = function () {
	  return Session.get("selectedLeagueId");
	};
	Template.hello.skaters = function () {
	  return Skaters.find({team: Session.get("selectedTeamId")});
	};
}
if (Meteor.isServer) {
	Meteor.methods({
		getSkatersForTeam: function (teamId) {
			if (!teamId) {
				console.error("team was undefined");
				return Skaters.find({}).fetch();
			}
			var rinxterQueryParams = {
				type: "skaterList",
				teamId: teamId
			};
			if (ThingsFetchedFromRinxter.find({type: "skaterList", teamId: teamId}).fetch().length === 0) {
				ThingsFetchedFromRinxter.insert(rinxterQueryParams);
				skaterListResponse = HTTP.get(
					"http://rinxter.net/wftda/ds",
					{params: rinxterQueryParams}
				);
				if (200 == skaterListResponse.statusCode) {
					var skaterList = EJSON.parse(skaterListResponse.content);
					console.log("loading " + skaterList.rows.length + " skaters");
					var skater = {};
					var skatersToInsert = [];
					for (i in skaterList.rows) {
					if (0 === i % 100) {
						console.log("loaded " + i + " skaters...");
					}
					skater.id = skaterList.rows[i].id;
					skater.data = skaterList.rows[i].data;
					skater.name = skater.data[0];
					skater.skaterNumber = skater.data[1];
					skater.team = teamId;
					if (skater.name) {
						// console.log("inserting ", skater.name, "team", skater.team);
						skatersToInsert.push(skater);
						Skaters.insert(skater); // minimongo does not yet support bulk inserts
					}
					}
					// Skaters.insert(skatersToInsert); // minimongo does not yet support bulk inserts
					console.log("finished loading skaters");
			  } else {
					console.error("failure");
					console.error(skaterListResponse.content);
				}
			} else {
				console.log("already got response from rinxter for this request", rinxterQueryParams);
			}
			// console.log("team id and skatesr:", teamId, Skaters.find({team:teamId}).fetch());
			console.log("returning this many:", Skaters.find({team:teamId}).count());
			return Skaters.find({team:teamId}).fetch();
		},
		emptyDatabase: function () {
			Leagues.remove({}, function () {console.log("emptied leagues");});
			Teams.remove({}, function () {console.log("emptied teams");});
			Skaters.remove({}, function () {console.log("emptied skaters");});
			ThingsFetchedFromRinxter.remove({}, function () {console.log("emptied list of things fetched");});
		},
		refreshDatabase: function () {
			Meteor.call("emptyDatabase");
			if (Leagues.find().fetch().length == 0) {
				HTTP.get("http://rinxter.net/wftda/ds", {
					params: {
						type: "leagueList"
					}
				}, function (_, leagueList) {
					if (false) {
						if (200 == leagueList.statusCode) {
							var leagues_response = EJSON.parse(leagueResult.content);
							var league = {}
							for (i in leagues_response.rows) {
								league.data = leagues_response.rows[i].data;
								league.name = league.data[0];
								league.id = leagues_response.rows[i].id;
								if (league.name) {
									Leagues.insert(league);
								}
							}
							console.log("finished loading leagues");
						} else {
							console.log("failure");
							console.error(result.content);
						}
					}
				});
			}
			if (Teams.find().fetch().length == 0) {
				HTTP.get("http://rinxter.net/wftda/ds", {
					params: {
						type: "teamList"
					}
				}, function (_, teamListResponse) {
					if (200 == teamListResponse.statusCode) {
						var teamList = EJSON.parse(teamListResponse.content);
						var team = {}
						for (i in teamList.rows) {
							team.data = teamList.rows[i].data;
							team.name = team.data[0];
							team.league = team.data[9];
							team.id = teamList.rows[i].id;
							if (team.name) {
								Teams.insert(team);
							}
						}
						console.log("loaded " + teamList.rows.length + " teams");
					} else {
						console.log("failure");
						console.error(teamListResponse.content);
					}
				});
			} else {
				console.log("teams was already loaded somehow: ", Teams.find().fetch());
			}
			// skaters are fetched lazily
		}
	});
	Meteor.startup(function () {
		// code to run on server at startup
		// Meteor.call('refreshDatabase');
	});;
}