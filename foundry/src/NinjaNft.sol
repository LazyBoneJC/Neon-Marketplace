// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract NinjaNft is ERC721, Ownable {
    // ... Error 定義 ...
    error ERC721Metadata__URI_QueryFor_NonExistentToken();

    struct NinjaTraits {
        string background;
        string hoodColor;
        string skinColor;
        string eyeColor;
        string bandColor;
    }

    // SVG 常數 (SVG_HEADER, HEAD_START 等)

    // 畫布與背景 (300x300)
    string constant SVG_HEADER = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">';

    // 忍者頭部輪廓 (圓形)
    // 我們把它拆開以便填入顏色
    string constant HEAD_START = '<circle cx="150" cy="150" r="120" fill="'; // 填入 hoodColor
    string constant HEAD_END = '"/>';

    // 面部開口 (讓皮膚露出來的部分 - 一個圓角矩形)
    string constant FACE_START = '<rect x="70" y="110" width="160" height="80" rx="40" fill="'; // 填入 skinColor
    string constant FACE_END = '"/>';

    // 銳利的眼睛 (Azuki 風格通常眼神很銳利)
    // 左眼
    string constant EYE_L_START = '<path d="M90 140 L130 150 L90 160 Z" fill="'; // 填入 eyeColor
    // 右眼
    string constant EYE_R_START = '"/><path d="M210 140 L170 150 L210 160 Z" fill="';
    string constant EYE_END = '"/>';

    // 頭帶 (額頭上的裝飾)
    string constant BAND_START = '<rect x="60" y="80" width="180" height="30" rx="5" fill="'; // 填入 bandColor
    string constant BAND_END = '"/>';

    // 金屬護額中心
    string constant METAL_PLATE =
        '<rect x="120" y="85" width="60" height="20" fill="#C0C0C0" stroke="#000" stroke-width="2"/>';

    string constant SVG_FOOTER = "</svg>";

    uint256 private s_tokenCounter;
    mapping(uint256 tokenId => string imageUri) private s_tokenIdToImageUri;

    event CreatedNFT(uint256 indexed tokenId); // 新增事件以便追蹤 NFT 創建

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    constructor() ERC721("Ninja NFT", "NINJA") Ownable(msg.sender) {}

    function mintNinja() public returns (uint256) {
        uint256 tokenCounter = s_tokenCounter;

        // 隨機數生成 (簡單版)
        uint256 seed = uint256(keccak256(abi.encodePacked(msg.sender, tokenCounter, block.timestamp)));

        // 使用新的繪圖函式
        string memory ninjaSvg = createNinjaSvg(seed);
        string memory imageUri = svgToImageURI(ninjaSvg);

        _safeMint(msg.sender, tokenCounter);

        s_tokenIdToImageUri[tokenCounter] = imageUri;
        emit CreatedNFT(tokenCounter);
        s_tokenCounter++;

        return tokenCounter;
    }

    // ... svgToImageURI, tokenURI, generateColorFromSeed 等輔助函式保持不變 ...
    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory baseURI = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(baseURI, svgBase64Encoded));
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (ownerOf(tokenId) == address(0)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        string memory imageURI = s_tokenIdToImageUri[tokenId];

        return string(
            abi.encodePacked(
                _baseURI(),
                Base64.encode(
                    bytes( // bytes casting actually unnecessary as 'abi.encodePacked()' returns a bytes
                        abi.encodePacked(
                            '{"name":"',
                            name(), // You can add whatever name here
                            '", "description":"A delicious pseudo-random cake!", ',
                            '"attributes": [{"trait_type": "yummy", "value": 100}], "image":"',
                            imageURI,
                            '"}'
                        )
                    )
                )
            )
        );
    }

    function generateColorFromSeed(uint256 seed) public pure returns (string memory) {
        bytes16 characters = "0123456789abcdef";
        bytes memory buffer = new bytes(7);

        buffer[0] = "#";

        for (uint256 i = 0; i < 6; i++) {
            uint8 hexDigit = uint8((seed >> (i * 8)) & 0xFF) % 16;
            buffer[i + 1] = bytes1(characters[hexDigit]);
        }

        return string(buffer);
    }

    // 記得把 createSvgCakeFromSeed 換成上面的 createNinjaSvg
    // 修改原有的 createSvgCakeFromSeed
    function createNinjaSvg(uint256 seed) public pure returns (string memory) {
        NinjaTraits memory traits;

        // 1. 生成顏色 (邏輯不變，只是變數名稱換了)
        traits.background = generateColorFromSeed(seed);
        traits.hoodColor = generateColorFromSeed(uint256(keccak256(abi.encodePacked(seed, uint256(1)))));
        traits.skinColor = "#F1C27D"; // 膚色通常固定比較好看，或者你可以隨機生成
        traits.eyeColor = generateColorFromSeed(uint256(keccak256(abi.encodePacked(seed, uint256(2)))));
        traits.bandColor = generateColorFromSeed(uint256(keccak256(abi.encodePacked(seed, uint256(3)))));

        // 2. 組裝 SVG 字串
        string memory finalSvg = string.concat(
            SVG_HEADER,
            // 背景 (簡單填滿)
            '<rect width="100%" height="100%" fill="',
            traits.background,
            '"/>',
            // 頭套 (Hood)
            HEAD_START,
            traits.hoodColor,
            HEAD_END,
            // 臉部皮膚
            FACE_START,
            traits.skinColor,
            FACE_END,
            // 頭帶
            BAND_START,
            traits.bandColor,
            BAND_END,
            METAL_PLATE, // 金屬牌是固定的
            // 眼睛
            EYE_L_START,
            traits.eyeColor,
            EYE_R_START,
            traits.eyeColor,
            EYE_END,
            SVG_FOOTER
        );

        return finalSvg;
    }

    /*//////////////////////////////////////////////////////////////
                                GETTERS
    //////////////////////////////////////////////////////////////*/
    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
