import mysql from "mysql";
import { DB_CONFIG } from "../constants.js";

export const getCreateRoom = (req, res) => {
  if (!req.session.user_id) return res.redirect("/");
  res.render("createRoom");
};

export const postCreateRoom = (req, res) => {
  if (!req.session.user_id) return res.redirect("/");
  const {
    total_occupancy,
    total_beds,
    total_bathrooms,
    summary,
    address,
    name,
  } = req.body;
  let createRoomQuery = `INSERT INTO rooms(
    total_occupancy,
    total_beds,
    total_bathrooms,
    summary,
    address,
    name,
    owner_id)
  VALUES(
      ?,?,?,?,?,?,?
  )`; // NO SQL INJECTION
  let parameters = [
    total_occupancy,
    total_beds,
    total_bathrooms,
    summary,
    address,
    name,
    req.session.user_id,
  ];
  let mysqlConnection = mysql.createConnection(DB_CONFIG);
  mysqlConnection.query(createRoomQuery, parameters, (error, rows) => {
    if (error) throw error;
    mysqlConnection.end();
    res.redirect("/");
  });
};

export const getHome = (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    return res.render("home", { name: null, isLoggedIn: false, rooms: null });
  }
  let userQuery = `SELECT first_name FROM users WHERE id=?`; // NOT VULNERABLE
  let roomsQuery = `SELECT name, id FROM rooms ORDER BY id DESC LIMIT 5`;

  let name;
  let mysqlConnection = mysql.createConnection(DB_CONFIG);
  mysqlConnection.query(userQuery, [user_id], (error, rows) => {
    if (error) throw error;

    if (!error) {
      name = rows[0].first_name;
      mysqlConnection.query(roomsQuery, (error, rows) => {
        if (error) throw error;

        if (!error) {
          mysqlConnection.end();
          res.render("home", { name, isLoggedIn: true, rooms: rows });
        }
      });
    }
  });
};

export const getRoom = (req, res) => {
  let { id } = req.params;
  let roomsQuery = `SELECT r.*, CONCAT(u.first_name," ",u.last_name) owner FROM rooms r 
  INNER JOIN users u ON u.id=r.owner_id WHERE r.id=?`;
  // NOT VULNERABLE TO SQL INJECTION

  let user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/");
  }

  let mysqlConnection = mysql.createConnection(DB_CONFIG);
  // Parameterized query
  mysqlConnection.query(roomsQuery, [id], (error, rows) => {
    if (error) throw error;

    if (!error) {
      mysqlConnection.end();
      if (rows.length === 0)
        return res.send(
          "<h1>Bad Query Please Try Again</h1><a href='/'>Home</a>"
        );
      return res.render("roomDetails", { room: rows[0] });
    }
  });
};
