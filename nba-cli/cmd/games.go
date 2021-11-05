/*
Copyright © 2021 NAME HERE <EMAIL ADDRESS>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/fatih/color"
	"io/ioutil"
	"math"
	"net/http"
	"regexp"
	"time"

	"github.com/spf13/cobra"
)

func iterativeDigitsCount(number int) int {
	count := 0
	for number != 0 {
		number /= 10
		count += 1
	}
	return count
}

// gamesCmd represents the games command
var gamesCmd = &cobra.Command{
	Use:   "games",
	Short: "Fetches game data",
	Long: ``,
	Run: func(cmd *cobra.Command, args []string) {
		var date string
		if len(args) == 0 {
			date = "today"
		} else {
			date = args[0]
		}

		r, _ := regexp.Compile("[0-9]{4}-[0-9]{2}-[0-9]{2}")
		if !r.MatchString(date) {
			date = parseDate(date)
		}
		gamesString := fetchGameForDate(date)
		var responseJSON []GameData
		json.Unmarshal([]byte(gamesString), &responseJSON)

		yellow := color.New(color.FgYellow).SprintFunc()
		red := color.New(color.FgRed).SprintFunc()
		green := color.New(color.FgGreen).SprintFunc()
		blue := color.New(color.FgBlue).SprintFunc()
		magenta := color.New(color.FgMagenta).SprintFunc()

		var longestTimeString int32 = 0

		var longestHomeTeamName int32 = 0
		var longestAwayTeamName int32 = 0

		var largestHomeScoreDigits int32 = 0
		var largestAwayScoreDigits int32 = 0

		for _, item := range responseJSON {
			var timeString = item.Time
			if item.State == "upcoming" {
				t, _ := time.Parse(time.RFC3339, item.Time)
				timeString = t.In(time.Now().Location()).Format(time.Kitchen)
			}
			longestTimeString = int32(math.Max(float64(len(timeString)), float64(longestTimeString)))

			longestHomeTeamName = int32(math.Max(float64(len(item.HomeTeam.Name)), float64(longestHomeTeamName)))
			longestAwayTeamName = int32(math.Max(float64(len(item.AwayTeam.Name)), float64(longestAwayTeamName)))

			largestHomeScoreDigits = int32(math.Max(
				float64(iterativeDigitsCount(int(item.HomeTeam.Points))),
				float64(largestHomeScoreDigits)),
			)
			largestAwayScoreDigits = int32(math.Max(
				float64(iterativeDigitsCount(int(item.AwayTeam.Points))),
				float64(largestAwayScoreDigits)),
			)
		}
		for _, item := range responseJSON {
			var timeString = item.Time
			if item.State == "upcoming" {
				t, _ := time.Parse(time.RFC3339, item.Time)
				timeString = t.In(time.Now().Location()).Format(time.Kitchen)
			}

			var homeScoreColor = blue
			var awayScoreColor = blue
			if item.HomeTeam.Points > item.AwayTeam.Points {
				homeScoreColor = green
				awayScoreColor = red
			} else if item.HomeTeam.Points < item.AwayTeam.Points {
				homeScoreColor = red
				awayScoreColor = green
			}

			var timeStringColor = magenta

			if item.State == "upcoming" {
				timeStringColor = blue
			} else if item.State == "finished" {
				timeStringColor = yellow
			}
			
			fmt.Printf(
				//os.Stdout,
				"%s %s %s %s @ %s %s %s\n",
				timeStringColor(fmt.Sprintf(fmt.Sprintf("%%-%ds", longestTimeString), timeString)),
				fmt.Sprintf(fmt.Sprintf("%%%ds", longestAwayTeamName), item.AwayTeam.Name),
				fmt.Sprintf("%-5v", "(" + item.AwayTeam.Record + ")"),
				awayScoreColor(fmt.Sprintf(fmt.Sprintf("%%%dv", largestAwayScoreDigits), item.AwayTeam.Points)),
				homeScoreColor(fmt.Sprintf(fmt.Sprintf("%%-%dv", largestHomeScoreDigits), item.HomeTeam.Points)),
				fmt.Sprintf(fmt.Sprintf("%%-%ds", longestHomeTeamName), item.HomeTeam.Name),
				fmt.Sprintf("%-5v", "(" + item.HomeTeam.Record + ")"),
			)
		}
	},
}

func init() {
	rootCmd.AddCommand(gamesCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// gamesCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// gamesCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

func parseDate(inputDateStr string) string {
	dateStr := ""
	switch inputDateStr {
	case "tomorrow":
		dateStr = time.Now().Add(time.Hour * 24).Format("2006-01-02")
	case "tm":
		dateStr = time.Now().Add(time.Hour * 24).Format("2006-01-02")
	case "yesterday":
		dateStr = time.Now().Add(time.Hour * -24).Format("2006-01-02")
	case "today":
		dateStr = time.Now().Format("2006-01-02")
	case "td":
		dateStr = time.Now().Format("2006-01-02")
	default:
		dateStr = time.Now().Format("2006-01-02")
	}
	return dateStr

}
func fetchGameForDate(dateStr string) string {
	url := fmt.Sprintf("https://us-central1-stunning-surge-306101.cloudfunctions.net/get_nba_games?date=%s", dateStr)

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	return string(body)

}

type GameData struct {
	State string
	Time string
	AwayTeam struct {
		Name string
		Record string
		Points int32
	}
	HomeTeam struct {
		Name string
		Record string
		Points int32
	}
}
