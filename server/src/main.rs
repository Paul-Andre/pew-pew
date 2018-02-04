extern crate websocket;

use std::thread;
use websocket::OwnedMessage;
use websocket::sync::Server;

use std::cell::RefCell;

use std::collections::HashMap;
use std::ops::Add;
use std::ops::Mul;


extern crate serde;
extern crate serde_json;

#[macro_use]
extern crate serde_derive;



#[macro_use]
extern crate chan;

type Id = u32;

#[derive(PartialEq, Eq, Clone, Copy, Serialize, Deserialize, Debug)]
struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}


#[derive(Clone, Serialize, Deserialize, Debug)]
struct PlayerInfo {
    name: String,
    color: String,
}


#[derive(PartialEq, Clone, Copy, Debug, Serialize, Deserialize)]
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


#[derive(PartialEq, Clone, Copy, Debug, Serialize)]
struct Existence {
    loc: P2,
    dloc: P2,
}

impl Existence {
    /// timestep is in seconds
    fn update(&mut self, timestep: f64) {
        self.loc = self.loc + self.dloc*timestep;
    }
}

#[derive(PartialEq, Clone, Copy, Debug, Serialize)]
struct Ship {
    health: u16,
    max_health: u16,
}

#[derive(PartialEq, Clone, Copy, Debug, Serialize)]
struct Bullet {
    time_remaining: u16,
    damage: u16,
}


/// Refers to what array and what position
#[derive(PartialEq, Clone, Debug, Serialize)]
enum Special {
    Ship(Ship),
    Bullet(Bullet),
}

#[derive(PartialEq, Clone, Debug, Serialize)]
struct GameObject {
    exis: Existence,
    spec: Special,

    #[serde(skip_serializing)]
    radius: f64
}

#[derive(Default)]
struct GameController {
    state: GameState,

    receivers: HashMap<Id,websocket::receiver::Reader<std::net::TcpStream>>,
    senders: HashMap<Id,websocket::sender::Writer<std::net::TcpStream>>,

    next_id: Id,
}


#[derive(Default, Serialize)]
struct GameState {
    player_infos: HashMap<Id, PlayerInfo>,
    game_objects: HashMap<Id, GameObject>,

    width: f64,
    height: f64,
}


fn valid_thrust(x: f64,y: f64) -> bool{
    !x.is_nan() && !y.is_nan() && !x.is_infinite() && !y.is_infinite() &&
    x*x + y*y <= 1.
}

impl GameState {

    fn new_ship(&mut self, player_id: Id, info: &PlayerInfo) {
        self.game_objects.insert(player_id, GameObject {
            exis: Existence{
                loc: P2{
                    x: 5.,
                    y: 5.,
                },
                dloc: P2{
                    x: 0.,
                    y: 0.,
                },
            },
            spec: Special::Ship( Ship {
                health: 100,
                max_health: 100,
            }),
            radius: 10.,
        });
    }


    fn apply_text_input(&mut self, player_id: Id, ti: TextInput) -> bool {
        match ti {
            TextInput::Info(info) => {
                if self.game_objects.get(&player_id) == None {
                    self.new_ship(player_id, &info);
                }
                self.player_infos.insert(player_id, info);
                true
            },
            TextInput::Move(PlayerMove::Thrust(P2{x:x,y:y})) => {
                if valid_thrust(x,y) {
                    if let Some(s) = self.game_objects.get_mut(&player_id) {
                        s.exis.dloc.x = x;
                        s.exis.dloc.y = y;
                        true
                    }
                    else {
                        false
                    }
                }
                else {
                    false
                }
            },
            _ => {true}
        }
    }
}


impl GameController {

    fn new() -> GameController {
        GameController{
            state: GameState::new(),
            ..GameController::default()
        }
    }

    fn new_connection(&mut self, mut receiver: websocket::receiver::Reader<std::net::TcpStream>,
                  sender : websocket::sender::Writer<std::net::TcpStream>) {

        receiver.stream.get_mut().set_nonblocking(true);
        sender.stream.set_nonblocking(true); // Not sure why I'd want to do this

        self.receivers.insert(self.next_id, receiver);
        self.senders.insert(self.next_id, sender);
        self.next_id += 1;
    }

    fn remove(&mut self, id: Id) {
        self.receivers.remove(&id);
        self.senders.remove(&id);
        self.state.game_objects.remove(&id);
        self.state.player_infos.remove(&id);
    }
}


impl<'a> GameState {

    fn new() -> GameState {
        GameState {
            width: 1000.,
            height: 500.,
            ..Default::default()
        }
    }


    fn get_initial_game_info(&'a self) -> InitialGameInfo<'a> {
        InitialGameInfo {
            players: &self.player_infos,
            width: self.width,
            height: self.height
        }
    }
}

#[derive(Serialize)]
struct InitialGameInfo<'a> {
    players: &'a HashMap<Id, PlayerInfo>,
    width: f64,
    height: f64,
}


#[derive(Deserialize, Serialize, Debug, Clone, Copy)]
enum PlayerMove {
    Thrust(P2),
    AttackNormal,
    AttackSpecial,
}


#[derive(Deserialize, Serialize, Debug, Clone)]
enum TextInput {
    Info(PlayerInfo),
    Move(PlayerMove)
}



fn main() {
    let mut server = Server::bind("127.0.0.1:9000").unwrap();

    let mut game_controller: GameController = GameController::new();

    server.set_nonblocking(true);

    let tick = chan::tick_ms(1000);
    loop {
        chan_select! {
            tick.recv() => {

                let ser_initial_game_info = serde_json::to_string(&game_controller.state).unwrap();
                let message = OwnedMessage::Text(ser_initial_game_info);

                for (id, sender) in &mut game_controller.senders {
                    sender.send_message(&message).unwrap();
                }


                let mut to_close: Vec<Id> = Vec::new();

                // Process moves
                for (id, receiver) in &mut game_controller.receivers {
                    let mut should_close = false;
                    for maybe_message in receiver.incoming_messages() {
                        match maybe_message {
                            Ok(message) => {
                                match message {
                                    OwnedMessage::Text(text) => {
                                        match serde_json::from_str::<TextInput>(&text) {
                                            Ok(mov) => {
                                                if !game_controller.state.apply_text_input(*id, mov) {
                                                    println!("inc apply mov ");
                                                    should_close = true;
                                                    break;
                                                }
                                            },
                                            Err(_) => {
                                                println!("inner errr ");
                                                should_close = true;
                                                break;
                                            }
                                        }
                                    },
                                    OwnedMessage::Ping(ping) => {
                                        let message = OwnedMessage::Pong(ping);
                                        game_controller.senders.get_mut(id).unwrap().send_message(&message);
                                    },
                                    OwnedMessage::Close(_) => {
                                        println!("asdf asdf  close");
                                        should_close = true;
                                        break;
                                    },
                                    _ => {},
                                }
                            },
                            Err(websocket::result::WebSocketError::IoError(err)) => {
                                if (err.raw_os_error() != Some(11)) {
                                    println!("asdf asdf {:?}", err );
                                    should_close = true;
                                }
                                break;
                            },
                            _ => {
                                println!("asdf asdf {:?}", maybe_message );
                                should_close = true;
                                break;
                            }
                        }
                    }
                    if (should_close) {
                        to_close.push(*id);
                    }

                }

                for id in to_close {
                    println!("Remoing id {}", id);
                    game_controller.remove(id);
                }



                // Get new connections
                while let Ok(request) = server.accept() {
                    // Spawn a new thread for each connection.
                    let mut client = request.accept().unwrap();

                    let ip = client.peer_addr().unwrap();

                    println!("Connection from {}", ip);


                    let ser_initial_game_info = serde_json::to_string(&game_controller.next_id).unwrap();

                    let message = OwnedMessage::Text(ser_initial_game_info);
                    client.send_message(&message);


                    let (receiver, sender) = client.split().unwrap();
                    game_controller.new_connection(receiver, sender);
                }

            }
        }
    }
}
