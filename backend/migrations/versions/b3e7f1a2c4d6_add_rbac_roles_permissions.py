"""add_rbac_roles_permissions

Revision ID: b3e7f1a2c4d6
Revises: a156543b1b77
Create Date: 2026-06-23 06:20:00.000000
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone

# revision identifiers, used by Alembic
revision = 'b3e7f1a2c4d6'
down_revision = 'a156543b1b77'
branch_labels = None
depends_on = None

# Module slugs used for seeding default permissions
MODULE_SLUGS = [
    "dashboard", "intake", "inventory", "warehouse_receipts",
    "dispatch", "market", "farmers", "users", "warehouses",
    "reports", "settings",
]

# Default roles matching the old UserRole enum
DEFAULT_ROLES = [
    {"name": "admin", "description": "System administrator with full access", "is_superadmin": True},
    {"name": "farmer", "description": "Farmer user", "is_superadmin": False},
    {"name": "fpo_staff", "description": "FPO Staff member", "is_superadmin": False},
    {"name": "fpo_manager", "description": "FPO Manager", "is_superadmin": False},
    {"name": "aggregator", "description": "Aggregator / collection point", "is_superadmin": False},
    {"name": "market_partner", "description": "Market partner / buyer", "is_superadmin": False},
]

# Permission presets per role  (True = granted)
# Format: role_name -> { module_slug: (can_view, can_add, can_edit, can_delete) }
ROLE_PERMISSIONS = {
    "admin": {slug: (True, True, True, True) for slug in MODULE_SLUGS},
    "fpo_manager": {
        "dashboard": (True, False, False, False),
        "intake": (True, True, True, True),
        "inventory": (True, True, True, True),
        "warehouse_receipts": (True, True, True, True),
        "dispatch": (True, True, True, True),
        "market": (True, True, True, False),
        "farmers": (True, True, True, False),
        "users": (True, True, True, False),
        "warehouses": (True, True, True, False),
        "reports": (True, False, False, False),
        "settings": (True, True, True, False),
    },
    "fpo_staff": {
        "dashboard": (True, False, False, False),
        "intake": (True, True, True, False),
        "inventory": (True, False, False, False),
        "warehouse_receipts": (True, True, True, False),
        "dispatch": (True, True, True, False),
        "market": (True, False, False, False),
        "farmers": (True, True, True, False),
        "users": (False, False, False, False),
        "warehouses": (True, False, False, False),
        "reports": (True, False, False, False),
        "settings": (False, False, False, False),
    },
    "farmer": {
        "dashboard": (True, False, False, False),
        "intake": (False, False, False, False),
        "inventory": (False, False, False, False),
        "warehouse_receipts": (True, False, False, False),
        "dispatch": (False, False, False, False),
        "market": (True, False, False, False),
        "farmers": (False, False, False, False),
        "users": (False, False, False, False),
        "warehouses": (False, False, False, False),
        "reports": (False, False, False, False),
        "settings": (False, False, False, False),
    },
    "aggregator": {
        "dashboard": (True, False, False, False),
        "intake": (True, True, False, False),
        "inventory": (True, False, False, False),
        "warehouse_receipts": (True, False, False, False),
        "dispatch": (True, True, False, False),
        "market": (True, False, False, False),
        "farmers": (True, False, False, False),
        "users": (False, False, False, False),
        "warehouses": (True, False, False, False),
        "reports": (True, False, False, False),
        "settings": (False, False, False, False),
    },
    "market_partner": {
        "dashboard": (True, False, False, False),
        "intake": (False, False, False, False),
        "inventory": (True, False, False, False),
        "warehouse_receipts": (True, False, False, False),
        "dispatch": (True, False, False, False),
        "market": (True, True, True, False),
        "farmers": (False, False, False, False),
        "users": (False, False, False, False),
        "warehouses": (False, False, False, False),
        "reports": (True, False, False, False),
        "settings": (False, False, False, False),
    },
}


def upgrade() -> None:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # 1. Create roles table (NO 'version' column!)
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(50), unique=True, nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("is_superadmin", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text(f"'{now}'")),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.text(f"'{now}'")),
    )

    # 2. Create permissions table
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("role_id", sa.Integer, sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("module_slug", sa.String(50), nullable=False),
        sa.Column("can_view", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("can_add", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("can_edit", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("can_delete", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.UniqueConstraint("role_id", "module_slug", name="uq_role_module"),
    )

    # 3. Seed default roles
    conn = op.get_bind()
    for role_def in DEFAULT_ROLES:
        conn.execute(
            sa.text(
                "INSERT INTO roles (name, description, is_superadmin, created_at, updated_at) "
                "VALUES (:name, :desc, :sa, :now, :now)"
            ),
            {"name": role_def["name"], "desc": role_def["description"],
             "sa": role_def["is_superadmin"], "now": now},
        )

    # Fetch inserted role IDs
    rows = conn.execute(sa.text("SELECT id, name FROM roles")).fetchall()
    role_id_map = {r[1]: r[0] for r in rows}

    # 4. Seed default permissions
    for role_name, perms in ROLE_PERMISSIONS.items():
        rid = role_id_map.get(role_name)
        if not rid:
            continue
        for slug, (cv, ca, ce, cd) in perms.items():
            conn.execute(
                sa.text(
                    "INSERT INTO permissions (role_id, module_slug, can_view, can_add, can_edit, can_delete) "
                    "VALUES (:rid, :slug, :cv, :ca, :ce, :cd)"
                ),
                {"rid": rid, "slug": slug, "cv": cv, "ca": ca, "ce": ce, "cd": cd},
            )

    # 5. Add role_id column to users
    op.add_column("users", sa.Column("role_id", sa.Integer, nullable=True))
    op.create_foreign_key("fk_users_role_id", "users", "roles", ["role_id"], ["id"], ondelete="SET NULL")

    # 6. Migrate existing enum values → role_id
    for role_name, rid in role_id_map.items():
        conn.execute(
            sa.text("UPDATE users SET role_id = :rid WHERE role = :rname"),
            {"rid": rid, "rname": role_name},
        )

    # 7. Drop old enum column
    op.drop_column("users", "role")


def downgrade() -> None:
    # Re-add the enum column
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.Enum("farmer", "fpo_staff", "fpo_manager", "aggregator", "market_partner", "admin",
                     name="userrole"),
            nullable=True,
        ),
    )

    # Migrate role_id back to enum values
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, name FROM roles")).fetchall()
    for rid, rname in rows:
        conn.execute(
            sa.text("UPDATE users SET role = :rname WHERE role_id = :rid"),
            {"rname": rname, "rid": rid},
        )

    # Make role NOT NULL again
    op.alter_column("users", "role", nullable=False)

    # Drop FK and role_id
    op.drop_constraint("fk_users_role_id", "users", type_="foreignkey")
    op.drop_column("users", "role_id")

    # Drop tables
    op.drop_table("permissions")
    op.drop_table("roles")
