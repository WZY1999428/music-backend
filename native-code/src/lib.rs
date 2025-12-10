#![deny(clippy::all)]
use napi::{
  bindgen_prelude::*,
  threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
};
use napi_derive::napi;

#[napi(constructor)]
pub struct Watcher {

  
}

#[napi]
impl Watcher {
  #[napi(constructor)]
  pub fn new() -> Self {
    Watcher {

    }
  }
}

// #[napi]
// pub fn call_threadsafe_function(
//   watch_path: String,
//   callback: ThreadsafeFunction<String>,
// ) -> Result<()> {
//   let tsfn = Arc::new(Mutex::new(callback));
//   let (tx, rx) = mpsc::channel::<notify::Result<Event>>();
//   let mut watcher = notify::recommended_watcher(tx).unwrap();

//   println!("{watch_path}");
//   watcher
//     .watch(Path::new(watch_path.as_str()), RecursiveMode::Recursive)
//     .unwrap();
//   thread::spawn(move || {
//     let tsfn = tsfn.clone();
//     loop {
//       match rx.recv() {
//         Ok(event) => {
//           println!("event: {:?}", event);
//           tsfn.lock().unwrap().call(
//             Ok("123123123123".to_string()),
//             ThreadsafeFunctionCallMode::Blocking,
//           );
//         }
//         Err(e) => {
//           println!("watch error: {:?}", e);
//           break;
//         }
//       }
//     }
//     println!("thread end");
//   });
//   Ok(())
// }

#[napi]
pub fn plus_100(input: u32) -> u32 {
  input + 100
}
