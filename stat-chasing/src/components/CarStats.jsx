import { useReplays } from "./ReplaysContext";
import { useEffect, useState } from "react";
import { wrappedUtils } from "../utils";
import pluralize from "pluralize";
import styles from "../styles/CarStats.module.css";

function CarStats({ className }) {
  const { replays, playerId } = useReplays();
  const [usedCar, setUsedCar] = useState(null);
  const [usedCarArr, setUsedCarArr] = useState([]);

  useEffect(() => {
    if (replays.length > 0) {
      let usedCars = [];

      replays.forEach((replay) => {
        const carName = wrappedUtils.getUsedCar(replay, playerId);

        if (carName) {
          usedCars.push(carName);
        }
      });
      let usedCarUniqueArr = usedCars.filter(function (value, id, self) {
        return id == self.indexOf(value) && value != null;
      });

      setUsedCarArr(usedCarUniqueArr);
    }
  }, [replays]);

  function filterReplaysByUsedCar() {
    let replaysWithUsedCar = replays;

    if (usedCar) {
      replaysWithUsedCar = replays.filter((replay) => {
        const hasUsedCar = wrappedUtils.withUsedCar(replay, playerId, usedCar);
        return hasUsedCar;
      });
    }

    return replaysWithUsedCar || [];
  }

  function avgMainCoreStats() {
    const filteredReplays = filterReplaysByUsedCar();

    let statsArr = filteredReplays.map((replay) =>
      wrappedUtils.getMainCoreStats(replay, playerId)
    );

    const coreStatAvgs = {
      numberOfGames: statsArr.length,
    };
    const stats = [
      "goals",
      "shots",
      "saves",
      "assists",
      "score",
      "shooting_percentage",
    ];

    stats.forEach((stat) => {
      const statSum = statsArr.reduce((sum, obj) => sum + obj[stat], 0);
      coreStatAvgs[stat] = (statSum / statsArr.length).toFixed(2);
    });

    return coreStatAvgs;
  }

  const coreStatAvgs = avgMainCoreStats();

  // don't display if only one car
  if (usedCarArr.length <= 1) {
    // console.log("used carr arr:", usedCarArr);
    return (
      <div className={className}>
        <br />
        <br />
        <h3>Car Stats</h3>
        <br />
        <p>Only one car used, nothing to compare against.</p>
        <br />
      </div>
    );
  }

  return (
    <div className={className}>
      <h3>Car Stats</h3>
      <div className={styles.carsFilterSection}>
        <h4>Filter averages by used car:</h4>
        <div className={styles.carBtnsContainer}>
          <button onClick={() => setUsedCar(null)}>All</button>
          {usedCarArr.map((car) => {
            return (
              <button onClick={() => setUsedCar(car)} key={car}>
                {car}
              </button>
            );
          })}
        </div>
      </div>
      <table>
        <caption>
          Averages ({coreStatAvgs.numberOfGames}{" "}
          {pluralize("game", coreStatAvgs.numberOfGames)})
        </caption>
        <tbody>
          <tr>
            <th>Score</th>
            <td>{coreStatAvgs.score}</td>
          </tr>
          <tr>
            <th>Goals</th>
            <td>{coreStatAvgs.goals}</td>
          </tr>
          <tr>
            <th>Assists</th>
            <td>{coreStatAvgs.assists}</td>
          </tr>
          <tr>
            <th>Shots</th>
            <td>{coreStatAvgs.shots}</td>
          </tr>
          <tr>
            <th>Saves</th>
            <td>{coreStatAvgs.saves}</td>
          </tr>
          <tr>
            <th>Shooting Percentage</th>
            <td>{coreStatAvgs.shooting_percentage}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CarStats;
