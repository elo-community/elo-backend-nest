// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1363Receiver} from "./IERC1363Receiver.sol";

/**
 * @title TrivusEXP1363
 * @dev ERC-1363을 지원하는 TrivusEXP 토큰
 * transferAndCall을 통해 콜백 기반 좋아요 시스템 지원
 */
contract TrivusEXP1363 is ERC20, Ownable {
    /**
     * @dev 생성자
     * @param name 토큰 이름
     * @param symbol 토큰 심볼
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    /**
     * @dev 테스트용 토큰 발행 (Owner만)
     * @param to 받을 주소
     * @param amount 발행할 양
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev ERC-1363 transferAndCall 구현
     * @param to 받을 주소
     * @param value 전송할 양
     * @param data 콜백에 전달할 데이터
     * @return 성공 여부
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool) {
        _transfer(msg.sender, to, value);
        _callOnTransferReceived(msg.sender, msg.sender, to, value, data);
        return true;
    }

    /**
     * @dev 내부 콜백 호출 헬퍼
     * @param operator 호출자
     * @param from 보낸 주소
     * @param to 받을 주소
     * @param value 전송된 양
     * @param data 콜백 데이터
     */
    function _callOnTransferReceived(
        address operator,
        address from,
        address to,
        uint256 value,
        bytes calldata data
    ) internal {
        try IERC1363Receiver(to).onTransferReceived(operator, from, value, data) returns (bytes4 retval) {
            require(retval == IERC1363Receiver.onTransferReceived.selector, "1363: bad receiver");
        } catch Error(string memory reason) {
            // 에러 메시지를 그대로 전파
            revert(reason);
        } catch {
            // 기타 에러 (예: custom error)
            revert("1363: non receiver");
        }
    }
}
