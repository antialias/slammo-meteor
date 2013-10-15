var Leagues = new Meteor.Collection("leagues");
var Teams = new Meteor.Collection("teams");
var Skaters = new Meteor.Collection("skaters");
if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to slammo.";
  };
  Template.hello.events({
    'change .league-select' : function (event) {
      Session.set("selectedLeagueId", event.currentTarget.value);
    },
    'change .team-select' : function (event) {
      Session.set("selectedTeamId", event.currentTarget.value);
    },
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });
  Template.hello.leagues = function () {
    return Leagues.find();
  };
  Template.hello.teams = function () {
    return Teams.find({league: Session.get("selectedLeagueId")});
  };
  Template.hello.skaters = function () {
    console.log("skaters for team ", Session.get("selectedTeamId"), Teams.find({team: Session.get("selectedTeamId")}).fetch());
    return Teams.find({team: Session.get("selectedTeamId")});
  };
}
if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    if (Leagues.find().fetch().length == 0) {
      var leagueResult = HTTP.get("http://rinxter.net/wftda/ds", {
        params: {
          type: "leagueList"
        }
      });
      if (200 == leagueList.statusCode) {
        var leagues_response = EJSON.parse(leagueResult.content);
        Leagues.remove({});
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
    if (Teams.find().fetch().length == 0) {
      var teamListResponse = HTTP.get("http://rinxter.net/wftda/ds", {
        params: {
          type: "teamList"
        }
      });
      if (200 == teamListResponse.statusCode) {
        var teamList = EJSON.parse(teamListResponse.content);
        Teams.remove({});
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
        console.log("finished loading teams");
      } else {
        console.log("failure");
        console.error(teamListResponse.content);
      }
    }
    if (true || Skaters.find().fetch().length == 0) {
      var skaterListResponse = HTTP.get("http://rinxter.net/wftda/ds", {
        params: {
          type: "skaterList"
        }
      });
      if (200 == skaterListResponse.statusCode) {
        console.log("loading skaters...");
        var skaterList = EJSON.parse(skaterListResponse.content);
        Skaters.remove({});
        var skater = {}
        for (i in skaterList.rows) {
          skater.id = skaterList.rows[i].id;
          skater.data = skaterList.rows[i].data;
          skater.name = skater.data[0];
          skater.team = skater.data[3];
          skater.skaterNumber = skater.data[4];
          if (skater.name) {
            console.log("inserting ", skater.name, "team", skater.team);
            Skaters.insert(skater);
          }
        }
        console.log("finished loading skaters");
      } else {
        console.log("failure");
        console.error(skaterListResponse.content);
      }
    }
  });;
}