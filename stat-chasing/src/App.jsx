import { useState, useEffect, useRef } from "react";
import "./App.css";
import { useReplays } from "./ReplaysContext";
import { wrappedUtils } from "./utils";
import Stats from "./Stats";
import AdminLoginBtn from "./AdminLoginBtn";

function App() {
  const {
    replays,
    setReplays,
    loading,
    setLoading,
    error,
    setError,
    playerName,
    setPlayerName,
  } = useReplays();

  const [playerId, setPlayerId] = useState("");
  const [inputError, setInputError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [lastPlayerId, setLastPlayerId] = useState("");
  const [lastFetchDate, setLastFetchDate] = useState(null);

  const matchGuids = new Set();
  const initialFetch = useRef(true);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/check_admin", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setIsAdmin(data.is_admin);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const fetchReplays = async (playerId, afterDate = null) => {
    try {
      const startTime = new Date().getTime();

      const requestBody = { player_id: playerId };
      if (afterDate) {
        requestBody.after_date = afterDate;
      }

      const response = await fetch(
        `http://localhost:3000/${
          isAdmin ? "fetch_old_replays" : "fetch_replays"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            player_id: playerId,
            after_date: afterDate,
          }),
        }
      );

      if (response.status >= 400) {
        throw new Error("server error");
      }

      const data = await response.json();
      console.log("fetched replays:", data);

      const uniqueReplays = data.filter((replay) => {
        if (matchGuids.has(replay["replay_stats"][0]["stats"]["match_guid"])) {
          return false;
        } else {
          matchGuids.add(replay["replay_stats"][0]["stats"]["match_guid"]);
          return true;
        }
      });
      console.log("Unique replays:", uniqueReplays);

      // refactor this?
      if (uniqueReplays.length > 0) {
        setReplays((prevReplays) => {
          matchGuids.clear();

          console.log("match guids set:", matchGuids);
          console.log("prev replays:", prevReplays);
          console.log("unique replays:", uniqueReplays);

          const combinedReplays = [...prevReplays, ...uniqueReplays].filter(
            (replay) => {
              console.log("Checking replay:", replay);
              console.log(
                "match guid:",
                replay["replay_stats"][0]["stats"]["match_guid"]
              );
              if (
                matchGuids.has(replay["replay_stats"][0]["stats"]["match_guid"])
              ) {
                return false;
              } else {
                matchGuids.add(
                  replay["replay_stats"][0]["stats"]["match_guid"]
                );
                return true;
              }
            }
          );

          console.log("combined replays after filtering:", combinedReplays);

          const sortedReplaysArr = combinedReplays.sort(
            (a, b) => new Date(a["data"]["date"] - new Date(b["data"]["date"]))
          );

          if (afterDate) {
            const oldestReplayDate = sortedReplaysArr[0]?.["data"]["date"];
            if (oldestReplayDate) {
              setLastFetchDate(oldestReplayDate);
            }
          } else {
            const latestReplayDate =
              sortedReplaysArr[sortedReplaysArr.length - 1]?.["data"]["date"];

            if (latestReplayDate) {
              setLastFetchDate(latestReplayDate);
            }
          }

          console.log("sorted replays arr", sortedReplaysArr);

          return sortedReplaysArr;
        });

        await setPlayerNameUsingReplay(uniqueReplays, playerId);

        if (playerId !== lastPlayerId) {
          setReplays([...uniqueReplays]);
          setLastPlayerId(playerId);
        }
      } else {
        console.log("No replays found for this player.");
      }

      const endTime = new Date().getTime();
      const apiResponseTime = endTime - startTime;
      console.log("result:", apiResponseTime, "ms");
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const setPlayerNameUsingReplay = async (replays, playerId) => {
    const splitId = playerId.split(":")[1];
    const newPlayerName = wrappedUtils.getPlayerNameById(replays[0], splitId);
    setPlayerName(newPlayerName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setInputError(null);

    const urlPattern =
      /^https:\/\/ballchasing\.com\/player\/([^/]+\/[a-zA-Z0-9]+)$/;
    const match = playerId.match(urlPattern);

    if (!match) {
      setInputError(
        "Invalid URL format. The URL should look like the one displayed above"
      );
      setLoading(false);
      return;
    }

    const trimmedPlayerId = match[1].replace("/", ":");

    const afterDate = isAdmin
      ? customDate.toISOString().split(".")[0] + "Z"
      : null;
    fetchReplays(trimmedPlayerId, afterDate);
  };

  useEffect(() => {
    if (initialFetch.current) {
      initialFetch.current = false;
      fetchReplays(playerId);
    }
  }, []);

  if (loading) return <div className="loading">LOADING...</div>;
  if (error)
    return (
      <p className="error">
        A network error was encountered. Check your internet connection and try
        again.
      </p>
    );

  // console.log("player name:", playerName);
  // console.log(
  //   replays.map((replay) => {
  //     return replay["replay_stats"][0]["stats"];
  //   })
  // );

  return (
    <div>
      <h1>Statchasing</h1>
      <br />
      <br />
      <AdminLoginBtn />
      <br />
      <br />
      {isAdmin && (
        <div>
          <label>Select date to fetch older replays (admins only): </label>
          <input
            type="date"
            value={customDate ? customDate.toISOString().split("T")[0] : ""}
            onChange={(e) => setCustomDate(new Date(e.target.value))}
          />
        </div>
      )}
      <br />
      <br />
      <form onSubmit={handleSubmit}>
        <label>
          copy and paste a player's ballchasing profile URL.
          (https://ballchasing.com/player/steam/76561198136291441)
          <br />
          <br />
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="Enter ballchasing player URL"
          />
        </label>
        <button type="submit">Get Replays</button>
      </form>
      {inputError && <p className="error">{inputError}</p>}

      {/* would like to display a message when a player wasn't found/when player has no replays available */}
      {playerName && (
        <div style={{ margin: "2rem" }}>
          <div style={{ fontSize: "1.1rem" }}>
            <br />
            <Stats replays={replays} playerName={playerName} />
          </div>
          <br />
        </div>
      )}
    </div>
  );
}

export default App;
