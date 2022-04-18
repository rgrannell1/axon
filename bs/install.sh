
source "bs/bundle.sh"

sudo cp dist/axon /usr/bin/axon
sudo cp dist/axon-export /usr/bin/axon-export
sudo cp dist/axon-import /usr/bin/axon-import

echo '🧠 axon installed.'

ls /usr/bin/axon*
