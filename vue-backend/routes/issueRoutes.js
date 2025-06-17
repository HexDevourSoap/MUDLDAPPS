const express = require("express");
const {
    createIssue,
    createIssueComputers,
    getIssues,
    getIssueById,
    getComputersForIssue,
    updateIssueStatus,
    updateIssueComputerStatus,
    getIssueComments,
    addIssueComment
} = require("../services/issueService");

const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

router.get("/issues", authenticateUser, async (req, res) => {
    try {
        const issues = await getIssues();
        res.json({ issues });
    } catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({ message: "Error fetching issues" });
    }
});

router.get("/issues/:id", authenticateUser, async (req, res) => {
    try {
        const issue = await getIssueById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }
        const computers = await getComputersForIssue(issue.issue_id);
        res.json({ issue, computers });
    } catch (error) {
        console.error("Error fetching issue:", error);
        res.status(500).json({ message: "Error fetching issue" });
    }
});

router.post("/issues", authenticateUser, authorizeRole(["lietotājs"]), async (req, res) => {
    try {
        const { user_id, title, description, status, computer_ids } = req.body;

        const { issue_id } = await createIssue({ user_id, title, description, status });
        await createIssueComputers(issue_id, computer_ids);

        res.status(201).json({ issue_id });
    } catch (error) {
        console.error("Error creating issue:", error);
        res.status(500).json({ message: "Error creating issue" });
    }
});

router.put("/issues/:id/status", authenticateUser, authorizeRole([/*"administrators", "pārvaldnieks"*/"laborants"]), async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!["pending", "solved", "unsolved"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        await updateIssueStatus(id, status);

        res.json({ message: "Status updated" });
    } catch (error) {
        console.error("Failed to update issue status:", error);
        res.status(500).json({ message: "Failed to update issue status" });
    }
});

router.put("/issues/:id/computer/:computerId", authenticateUser, authorizeRole([/*"administrators", "pārvaldnieks"*/"laborants"]), async (req, res) => {
    const { status } = req.body;

    try {
        await updateIssueComputerStatus(req.params.id, req.params.computerId, status);
        res.json({ message: "Computer issue status updated" });
    } catch (error) {
        console.error("Error updating computer issue status:", error);
        res.status(500).json({ message: "Error updating computer issue status" });
    }
});

router.get("/issues/:id/comments", authenticateUser, async (req, res) => {
    try {
        const comments = await getIssueComments(req.params.id);
        res.json({ comments });
    } catch (err) {
        console.error("Failed to fetch comments:", err);
        res.status(500).json({ message: "Failed to fetch comments" });
    }
});

router.post("/issues/:id/comments", authenticateUser, async (req, res) => {
    try {
        const { user_id, comment } = req.body;
        const issue_id = req.params.id;
        // const user_id = req.user.user_id;
        await addIssueComment(issue_id, user_id, comment);
        res.status(201).json({ message: "Comment added" });
    } catch (err) {
        console.error("Failed to add comment:", err);
        res.status(500).json({ message: "Failed to add comment" });
    }
});

module.exports = router;