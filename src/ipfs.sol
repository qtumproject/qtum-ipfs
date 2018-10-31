pragma solidity ^0.4.24;
contract ipfs{
 string[] name;
 uint256 index = 0;
 mapping (string => string) nametohash;

 
 function sendHash(string _name,string _ipfsHash) public {
     name.push(_name);
     nametohash[_name] = _ipfsHash;
     index++;
 }
 function getindex() public view returns (uint256){
     return index;
 }
  function getname(uint256 _index) public view returns (string ipfsName) {
   ipfsName = name[_index];
   return;
 }
 function gethash(string _name) public view returns (string ipfsNameHash){
     ipfsNameHash = nametohash[_name];
     return;
 }
}