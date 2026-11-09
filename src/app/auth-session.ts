import {Injectable, signal} from '@angular/core';

export interface MatriculaInfo {
  matricula: string;
  utb: string;
  funcao: string;
  perfil?: string;
}

export interface UsuarioTeste {
  cpf: string;
  nome: string;
  email?: string;
  matriculas: MatriculaInfo[];
}

export const USUARIOS_TESTE: UsuarioTeste[] = [
  {
    cpf: '52998224725', // 529.982.247-25 (CPF matematicamente válido)
    nome: 'Carlos Eduardo Lima',
    email: 'carlos.silva@gmail.com',
    matriculas: [
      { matricula: '0045213-9', utb: 'Escola Estadual Solon de Lucena', funcao: 'Professor', perfil: 'Administrador' },
    ],
  },
  {
    cpf: '10000000019', // 100.000.000-19 (CPF matematicamente válido)
    nome: 'Ana Beatriz Souza',
    email: 'ana.souza@see.pb.gov.br',
    matriculas: [
      { matricula: '0078451-2', utb: 'GRE 1ª Região — Regional Metropolitana', funcao: 'Técnico Administrativo Educacional', perfil: 'Administrador' },
      { matricula: '0091234-5', utb: 'Escola Estadual Presidente Costa e Silva', funcao: 'Coordenadora Pedagógica', perfil: 'Coordenadora Pedagógica' },
    ],
  },
  {
    cpf: '20000000020', // 200.000.000-20 (João - SEE-PB)
    nome: 'João da Silva Santos',
    email: 'joao@see.pb.gov.br',
    matriculas: [
      { matricula: '0186254-5', utb: 'Secretaria de Estado da Educação - Sede', funcao: 'Servidor Público', perfil: 'Servidor' },
    ],
  },
  {
    cpf: '10000000108', // 100.000.001-08 (CPF matematicamente válido - Primeiro Acesso)
    nome: 'Mariana Duarte Silva',
    email: 'mariana.silva@see.pb.gov.br',
    matriculas: [
      { matricula: '0034129-8', utb: 'Escola Estadual Daura Santiago Rangel', funcao: 'Supervisora Escolar', perfil: 'Supervisora' },
    ],
  },
];

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  readonly loggedInUser = signal<UsuarioTeste | null>(USUARIOS_TESTE[0]);
  readonly selectedMatricula = signal<MatriculaInfo | null>(USUARIOS_TESTE[0].matriculas[0]);
  readonly firstAccessRequired = signal<boolean>(false);
  readonly simulatedTemporaryPassword = signal<string>('Provisoria@123');
  readonly firstAccessPasswordChanged = signal<boolean>(false);
  private readonly completedFirstAccessCpfs = new Set<string>();

  isFirstAccessPending(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '');
    if (clean === '10000000108') {
      return !this.completedFirstAccessCpfs.has(clean);
    }
    return false;
  }

  resetFirstAccessPending(cpf = '10000000108') {
    this.completedFirstAccessCpfs.delete(cpf.replace(/\D/g, ''));
  }

  login(user: UsuarioTeste, matricula: MatriculaInfo) {
    this.loggedInUser.set(user);
    this.selectedMatricula.set(matricula);
    this.firstAccessRequired.set(false);
  }

  startFirstAccess(user: UsuarioTeste, temporaryPassword = 'Provisoria@123') {
    this.loggedInUser.set(user);
    this.selectedMatricula.set(null);
    this.firstAccessRequired.set(true);
    this.simulatedTemporaryPassword.set(temporaryPassword);
  }

  completeFirstAccess(newPassword?: string, cpf = '10000000108') {
    this.firstAccessRequired.set(false);
    this.completedFirstAccessCpfs.add(cpf.replace(/\D/g, ''));
    this.firstAccessPasswordChanged.set(true);
    this.logout();
  }

  consumeFirstAccessPasswordChanged(): boolean {
    const val = this.firstAccessPasswordChanged();
    if (val) {
      this.firstAccessPasswordChanged.set(false);
      return true;
    }
    return false;
  }

  logout() {
    this.loggedInUser.set(null);
    this.selectedMatricula.set(null);
    this.firstAccessRequired.set(false);
  }

  getCurrentUserName(): string {
    return this.loggedInUser()?.nome ?? 'Carlos Eduardo Lima';
  }

  getCurrentUserRole(): string {
    return this.selectedMatricula()?.perfil ?? this.selectedMatricula()?.funcao ?? 'Administrador';
  }

  getCurrentUserInitials(): string {
    const nome = this.getCurrentUserName();
    const parts = nome.split(' ').filter(p => p.trim().length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  }

  getCurrentMatriculaNumber(): string {
    return this.selectedMatricula()?.matricula ?? '0045213-9';
  }

  canSwitchMatricula(): boolean {
    const user = this.loggedInUser();
    return (user?.matriculas?.length ?? 0) > 1;
  }
}
