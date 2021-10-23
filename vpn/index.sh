# Get ca.crt
export DIR=/mnt/openvpn
export CA_CERT=$DIR/pki/ca.crt
export CA_KEY=$DIR/pki/private/ca.key
  
export DH=/pki/dh.pem

export CLIENT_NAME="OW1"
export CLIENT_KEY=/pki/private/${CLIENT_NAME}.key


get_ca() {
echo "CA_CERT"
  cat ${CA_CERT}

}

get_ca_key() {
  cat ${CA_KEY}
echo "KEY"

}
get_dh() {
  cat ${DH}
echo "DH"

}

get_client_key() {
echo "CL"

  cat ${CLIENT_KEY}
}


config() {

CMD="--local 0.0.0.0 --server 10.10.10.0 255.255.255.0 --port 1194  --tls-auth /etc/openvpn/tc.key 0 --cipher AES-256-CBC --data-ciphers AES-256-CBC --push "redirect-gateway def1 bypass-dhcp"  --proto udp --dev tun2 --dev-type tun --topology subnet --ca /etc/openvpn/ca.crt --cert /etc/openvpn/server.crt --key     /etc/openvpn/server.key --dh      /etc/openvpn/dh.pem --push 'route 192.168.1.0 255.255.255.0' --push 'route 10.10.10.0 255.255.255.0'"




  # internal tun0 connection IP
ifconfig-pool-persist ipp.txt


push "route 10.10.10.0 255.255.255.0"

push "redirect-gateway def1 bypass-dhcp"

keepalive 10 120
tls-auth /etc/openvpn/tc.key 0
auth-nocache
cipher AES-256-CBC
data-ciphers AES-256-CBC
persist-key
persist-tun
status /etc/openvpn/openvpn-status.log
verb 5  # verbose mode
client-to-client
explicit-exit-notify 1"
}
