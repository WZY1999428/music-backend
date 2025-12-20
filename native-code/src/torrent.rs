use librqbit::{AddTorrentOptions, ManagedTorrent, Session};
use std::{collections::HashMap, sync::Arc};
struct TorrentManager {
  session: Arc<Session>,
  active: HashMap<String, ManagedTorrent>,
  max_concurrent: usize,
}

impl TorrentManager {
  pub async fn new(path: String, max_concurrent: usize) -> Self {
    let session = Session::new(path.into()).await.unwrap();
    TorrentManager {
      session,
      active: HashMap::new(),
      max_concurrent,
    }
  }

  pub fn add_torrent(&mut self, options: AddTorrentOptions) {
  }
}
