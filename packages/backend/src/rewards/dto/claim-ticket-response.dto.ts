import { SignedClaimTicket } from '../../shared/eip712';

export class ClaimTicketResponseDto implements SignedClaimTicket {
  domain: SignedClaimTicket['domain'];
  types: SignedClaimTicket['types'];
  message: SignedClaimTicket['message'];
  signature: string;
}
