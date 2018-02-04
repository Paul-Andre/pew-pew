extern crate websocket;

use std::thread;
use websocket::OwnedMessage;
use websocket::sync::Server;


use std::collections::HashMap;
use std::ops::Add;
use std::ops::Mul;

type Id = u16;

#[derive(PartialEq, Eq, Clone, Copy)]
struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}


struct PlayerInfo {
    name: String,
    color: Color,
    id: Id
}


#[derive(PartialEq, Clone, Copy)]
struct P2 {
    x: f64,
    y: f64,
}

impl Add for P2 {
    type Output = P2;
    fn add(self, rhs: P2) -> P2 {
        P2 {x: self.x + rhs.x, y: self.y + rhs.y}
    }
}

impl Mul<f64> for P2 {
    type Output = P2;
    fn mul(self, rhs: f64) -> P2 {
        P2 {x:self.x * rhs, y:self.y * rhs}
    }
}


#[derive(PartialEq, Clone, Copy)]
struct Existence {
    loc: P2,
    dloc: P2,
    id: Id,
}

impl Existence {
    /// timestep is in seconds
    fn update(&mut self, timestep: f64) {
        self.loc = self.loc + self.dloc*timestep;
    }
}
        

#[derive(PartialEq, Clone, Copy)]
struct Ship {
    exist: Existence,
    health: u16,
}

#[derive(PartialEq, Clone, Copy)]
struct Bullet {
    exist: Existence,
    time_remaining: u16,
    damage: u16,
}


fn main() {

    let mut ships: Vec<Ship>  = Vec::new();
    let mut id_to_player: HashMap<Id, PlayerInfo> = HashMap::new();

    let server = Server::bind("127.0.0.1:9000").unwrap();

    for request in server.filter_map(Result::ok) {
        // Spawn a new thread for each connection.
        thread::spawn(move || {
            let mut client = request.accept().unwrap();

            let ip = client.peer_addr().unwrap();

            println!("Connection from {}", ip);

            let message = OwnedMessage::Text("Hello".to_string());
            client.send_message(&message).unwrap();

            let (mut receiver, mut sender) = client.split().unwrap();
            //let () = sender;

            for message in receiver.incoming_messages() {
                let message = message.unwrap();

                match message {
                    OwnedMessage::Close(_) => {
                        let message = OwnedMessage::Close(None);
                        sender.send_message(&message).unwrap();
                        println!("Client {} disconnected", ip);
                        return;
                    }
                    OwnedMessage::Ping(ping) => {
                        let message = OwnedMessage::Pong(ping);
                        sender.send_message(&message).unwrap();
                    }
                    _ => sender.send_message(&message).unwrap(),
                }
            }
        });
    }
}
