IP=""
SERVER=""
DCF=""
topology="subnet"


openvpn --local 0.0.0.0 --server 10.1.10.0 255.255.255.0  --data-ciphers-fallback AES-256-CBC --topology subnet --dh /etc/openvpn/dh.pem --ca /etc/o
penvpn/ca.crt --cert /etc/openvpn/server.crt --key /etc/openvpn/server.key --dev-type tun --dev tun5


openvpn --local $IP --server 10.10.10.0 255.255.0.0  --data-ciphers-fallback AES-256-CBC --topology subnet --dh $OVPN_DIR/dh.pem --ca $OVPN_DIR/ca.crt --cert $OVPN_DIR/server.crt --key /etc/openvpn/server.key --dev-type tun --dev tun5 --client-to-client --auth-user-pass
