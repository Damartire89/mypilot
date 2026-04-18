"""add audit_logs table and soft-delete on companies

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-17

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id', ondelete='SET NULL'), nullable=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('user_email', sa.String(length=200), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
    )
    op.create_index('idx_audit_logs_company_id', 'audit_logs', ['company_id'])
    op.create_index('idx_audit_logs_created_at', 'audit_logs', ['created_at'])

    op.add_column('companies', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index('idx_companies_deleted_at', 'companies', ['deleted_at'])


def downgrade() -> None:
    op.drop_index('idx_companies_deleted_at', 'companies')
    op.drop_column('companies', 'deleted_at')

    op.drop_index('idx_audit_logs_created_at', 'audit_logs')
    op.drop_index('idx_audit_logs_company_id', 'audit_logs')
    op.drop_table('audit_logs')
